// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC1363Receiver} from "@openzeppelin/contracts/interfaces/IERC1363Receiver.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract PostLikeSystem1363 is IERC1363Receiver, Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    // --- config ---
    IERC20 public immutable token;
    uint256 public likePrice;
    address public trustedSigner;

    // --- storage ---
    mapping(uint256 => uint256) public postLikes;                 // postId => likes
    mapping(uint256 => uint256) public postTokens;                // postId => collected tokens
    mapping(uint256 => mapping(address => bool)) public hasLiked; // postId => (user => liked?)
    mapping(bytes32 => bool) public usedClaimDigests;             // claim EIP-712 1회성
    mapping(bytes32 => bool) public usedBatchLikeDigests;         // batch-like EIP-712 1회성

    // 리플레이 방지 티켓: user + postId + this + chainId
    mapping(bytes32 => bool) public usedLikeTickets;

    // EIP-712 typehash
    bytes32 private constant CLAIM_TYPEHASH =
        keccak256("Claim(uint256 postId,address to,uint256 amount,uint256 deadline,bytes32 nonce)");
    bytes32 private constant LIKE_TYPEHASH =
        keccak256("Like(uint256 postId,address user,uint256 amount,uint256 deadline,bytes32 nonce)");

    // events
    event PostLiked(uint256 indexed postId, address indexed user, uint256 amount, uint256 timestamp);
    event TokensClaimed(address indexed to, uint256 indexed postId, uint256 amount, bytes signature);
    event LikePriceUpdated(uint256 price);
    event Swept(address to, uint256 amount);
    event TrustedSignerUpdated(address signer);

    constructor(address _token) Ownable(msg.sender) EIP712("PostLikeSystem1363", "1") {
        require(_token != address(0), "TOKEN_ZERO");
        token = IERC20(_token);
        likePrice = 1e18;
        trustedSigner = msg.sender;
    }

    // ----- admin -----
    function setLikePrice(uint256 _price) external onlyOwner {
        require(_price > 0, "PRICE_ZERO");
        likePrice = _price;
        emit LikePriceUpdated(_price);
    }

    function setTrustedSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "SIGNER_ZERO");
        trustedSigner = _signer;
        emit TrustedSignerUpdated(_signer);
    }

    // ----- ERC-1363 Receiver -----
    // data = abi.encode(uint256 postId)  (payload only!)
    function onTransferReceived(
        address /*operator*/,
        address from,
        uint256 value,
        bytes calldata data
    ) external override nonReentrant returns (bytes4) {
        require(msg.sender == address(token), "NOT_TOKEN");
        require(value == likePrice, "BAD_AMOUNT");
        require(data.length == 32, "BAD_DATA_LENGTH");

        uint256 postId = abi.decode(data, (uint256));

        // 1인 1회 제한
        require(!hasLiked[postId][from], "ALREADY_LIKED");

        // 도메인 고정 리플레이 방지
        bytes32 ticket = keccak256(abi.encode(from, postId, address(this), block.chainid));
        require(!usedLikeTickets[ticket], "REPLAY_LIKE");
        usedLikeTickets[ticket] = true;

        hasLiked[postId][from] = true;
        postLikes[postId] += 1;
        postTokens[postId] += value;

        emit PostLiked(postId, from, value, block.timestamp);
        return IERC1363Receiver.onTransferReceived.selector;
    }

    // ----- Claim (EIP-712) -----
    function claimWithSignature(
        uint256 postId,
        address to,
        uint256 amount,
        uint256 deadline,
        bytes32 nonce,
        bytes calldata signature
    ) external nonReentrant {
        require(block.timestamp <= deadline, "EXPIRED");
        require(amount > 0 && amount <= postTokens[postId], "BAD_AMOUNT");

        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(CLAIM_TYPEHASH, postId, to, amount, deadline, nonce))
        );
        require(!usedClaimDigests[digest], "USED");
        address signer = ECDSA.recover(digest, signature);
        require(signer == trustedSigner, "INVALID_SIGNER");

        usedClaimDigests[digest] = true;

        postTokens[postId] -= amount;
        token.safeTransfer(to, amount);

        emit TokensClaimed(to, postId, amount, signature);
    }

    // ----- Batch like (optional) -----
    function batchLikePosts(
        uint256[] calldata postIds,
        uint256[] calldata deadlines,
        bytes32[] calldata nonces,
        bytes[] calldata signatures
    ) external nonReentrant {
        uint256 n = postIds.length;
        require(n == deadlines.length && n == nonces.length && n == signatures.length, "LENGTH_MISMATCH");
        require(n > 0 && n <= 10, "INVALID_BATCH_SIZE");

        uint256 totalAmount = n * likePrice;
        require(token.balanceOf(msg.sender) >= totalAmount, "INSUFFICIENT_BALANCE");
        require(token.allowance(msg.sender, address(this)) >= totalAmount, "INSUFFICIENT_ALLOWANCE");

        for (uint256 i = 0; i < n; i++) {
            uint256 postId = postIds[i];
            require(block.timestamp <= deadlines[i], "EXPIRED");
            require(!hasLiked[postId][msg.sender], "ALREADY_LIKED");

            bytes32 digest = _hashTypedDataV4(
                keccak256(abi.encode(LIKE_TYPEHASH, postId, msg.sender, likePrice, deadlines[i], nonces[i]))
            );
            require(!usedBatchLikeDigests[digest], "LIKE_ALREADY_USED");
            address signer = ECDSA.recover(digest, signatures[i]);
            require(signer == trustedSigner, "INVALID_SIGNER");
            usedBatchLikeDigests[digest] = true;

            // 토큰 수취
            token.safeTransferFrom(msg.sender, address(this), likePrice);

            // 도메인 고정 리플레이 방지(추가 방어)
            bytes32 ticket = keccak256(abi.encode(msg.sender, postId, address(this), block.chainid));
            require(!usedLikeTickets[ticket], "REPLAY_LIKE");
            usedLikeTickets[ticket] = true;

            hasLiked[postId][msg.sender] = true;
            postLikes[postId] += 1;
            postTokens[postId] += likePrice;

            emit PostLiked(postId, msg.sender, likePrice, block.timestamp);
        }
    }

    // ----- ops -----
    function sweep(address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "TO_ZERO");
        require(amount > 0, "AMOUNT_ZERO");
        require(amount <= token.balanceOf(address(this)), "INSUFFICIENT_BALANCE");
        token.safeTransfer(to, amount);
        emit Swept(to, amount);
    }

    // ----- views -----
    function getPostInfo(uint256 postId, address user) external view returns (uint256, uint256, bool) {
        return (postLikes[postId], postTokens[postId], hasLiked[postId][user]);
    }

    function getContractBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function getPostTokens(uint256 postId) external view returns (uint256) {
        return postTokens[postId];
    }

    function likeTicketKey(address user, uint256 postId) external view returns (bytes32) {
        return keccak256(abi.encode(user, postId, address(this), block.chainid));
    }

    function isLikeTicketUsed(address user, uint256 postId) external view returns (bool) {
        return usedLikeTickets[keccak256(abi.encode(user, postId, address(this), block.chainid))];
    }

    function isBatchLikeDigestUsed(bytes32 digest) external view returns (bool) {
        return usedBatchLikeDigests[digest];
    }

    function isClaimDigestUsed(bytes32 digest) external view returns (bool) {
        return usedClaimDigests[digest];
    }
}
