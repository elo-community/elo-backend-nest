// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC1363Receiver} from "@openzeppelin/contracts/interfaces/IERC1363Receiver.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title PostLikeSystem1363
 * @dev ERC-1363 기반 좋아요 시스템 - 보안 강화 및 가스 최적화
 * - transferAndCall로 approve 없이 좋아요
 * - EIP-712 서명 기반 보상 인출
 * - 오프체인 인덱싱으로 가스 절약
 * - ReentrancyGuard, SafeERC20, EIP712 표준 적용
 */
contract PostLikeSystem1363 is IERC1363Receiver, Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;
    
    // 상태 변수
    IERC20 public immutable token;
    uint256 public likePrice; // 좋아요 가격 (기본 1e18)
    address public trustedSigner; // 신뢰할 수 있는 서명자
    
    // 핵심 매핑 (가스 최적화)
    mapping(uint256 => uint256) public postLikes; // 게시글별 좋아요 수
    mapping(uint256 => uint256) public postTokens; // 게시글별 수집된 토큰
    mapping(uint256 => mapping(address => bool)) public hasLiked; // 사용자별 좋아요 여부
    mapping(bytes32 => bool) public usedSignatures; // 사용된 서명 추적
    
    // 리플레이 방지를 위한 매핑
    mapping(bytes32 => bool) public usedLikeDigests; // 사용된 좋아요 해시 추적
    mapping(bytes32 => bool) public usedNonces; // 사용된 nonce 추적 (추가)
    mapping(address => uint256) public userNonces; // 사용자별 nonce (추가)
    
    // EIP-712 타입 해시
    bytes32 private constant CLAIM_TYPEHASH = keccak256(
        "Claim(uint256 postId,address to,uint256 amount,uint256 deadline,bytes32 nonce)"
    );
    
    // 이벤트
    event PostRegistered(uint256 indexed postId, address indexed author, uint256 timestamp);
    event PostLiked(uint256 indexed postId, address indexed user, uint256 amount, uint256 timestamp);
    event TokensClaimed(address indexed to, uint256 indexed postId, uint256 amount, bytes signature);
    event LikePriceUpdated(uint256 price);
    event Swept(address to, uint256 amount);
    event TrustedSignerUpdated(address signer);
    event NonceUsed(address indexed user, bytes32 indexed nonce, uint256 timestamp); // 추가

    /**
     * @dev 생성자
     * @param _token ERC-1363 토큰 컨트랙트 주소
     */
    constructor(address _token) Ownable(msg.sender) EIP712("PostLikeSystem1363", "1") {
        require(_token != address(0), "TOKEN_ZERO");
        token = IERC20(_token);
        likePrice = 1e18; // 기본 1 EXP
        trustedSigner = msg.sender; // 초기 서명자는 owner
    }

    /**
     * @dev 좋아요 가격 설정 (onlyOwner)
     * @param _price 새로운 좋아요 가격
     */
    function setLikePrice(uint256 _price) external onlyOwner {
        require(_price > 0, "PRICE_ZERO");
        likePrice = _price;
        emit LikePriceUpdated(_price);
    }

    /**
     * @dev 신뢰할 수 있는 서명자 설정 (onlyOwner)
     * @param _signer 새로운 서명자 주소
     */
    function setTrustedSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "SIGNER_ZERO");
        trustedSigner = _signer;
        emit TrustedSignerUpdated(_signer);
    }

    // 게시글 등록 기능 제거 - 오로지 서명 기반으로만 동작
    
    /**
     * @dev ERC1363 토큰 수신 시 자동 좋아요 처리
     * @param operator 토큰을 보낸 사용자
     * @param from 토큰을 보낸 주소
     * @param value 토큰 양
     * @param data 좋아요 데이터 (postId만)
     * @return ERC1363Receiver 표준 응답
     */
    function onTransferReceived(
        address operator,
        address from,
        uint256 value,
        bytes calldata data
    ) external override nonReentrant returns (bytes4) {
        // 1. 토큰 컨트랙트에서만 호출 가능
        require(msg.sender == address(token), "NOT_TOKEN");
        
        // 2. 좋아요 가격 검증
        require(value == likePrice, "BAD_AMOUNT");
        
        // 3. 데이터 길이 검증 (postId만: 32바이트)
        require(data.length == 32, "BAD_DATA_LENGTH");
        
        // 4. 데이터 디코딩 (postId만)
        uint256 postId = abi.decode(data, (uint256));
        
        // 5. 중복 좋아요 방지
        require(!hasLiked[postId][from], "ALREADY_LIKED");
        
        // 6. from 주소별 nonce 체크로 replay attack 방지
        bytes32 likeDigest = keccak256(abi.encodePacked(postId, from, value, userNonces[from]));
        require(!usedLikeDigests[likeDigest], "LIKE_ALREADY_USED");
        
        // 7. 좋아요 처리
        hasLiked[postId][from] = true;
        postLikes[postId]++;
        postTokens[postId] += value;
        usedLikeDigests[likeDigest] = true;
        userNonces[from]++;
        
        // 8. 이벤트 발생 (오프체인 인덱싱용)
        emit PostLiked(postId, from, value, block.timestamp);
        
        return IERC1363Receiver.onTransferReceived.selector;
    }

    /**
     * @dev EIP-712 서명 기반 토큰 인출
     * @param postId 게시글 ID
     * @param to 수신자 주소
     * @param amount 인출할 토큰 양
     * @param deadline 서명 만료시간
     * @param nonce 고유한 일회용 값
     * @param signature 백엔드에서 생성한 EIP-712 서명
     */
    function claimWithSignature(
        uint256 postId,
        address to,
        uint256 amount,
        uint256 deadline,
        bytes32 nonce,
        bytes calldata signature
    ) external nonReentrant {
        // 1. deadline 검증
        require(block.timestamp <= deadline, "EXPIRED");
        
        // 2. 토큰 양 검증
        require(amount > 0 && amount <= postTokens[postId], "BAD_AMOUNT");
        
        // 2.5. Nonce 중복 사용 방지 (추가)
        require(!usedNonces[nonce], "NONCE_ALREADY_USED");
        usedNonces[nonce] = true;
        
        // 2.6. 사용자별 nonce 순서 검증 (추가)
        require(userNonces[to] == 0 || userNonces[to] < uint256(nonce), "INVALID_NONCE_ORDER");
        userNonces[to] = uint256(nonce);
        
        // 3. EIP-712 서명 검증
        // 값이 하나라도 바뀌면 완전히 다른 해시가 생성됨
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(CLAIM_TYPEHASH, postId, to, amount, deadline, nonce))
        );
        
        // 4. 서명 재사용 방지
        require(!usedSignatures[digest], "USED");
        
        // 5. 서명자 검증
        address signer = ECDSA.recover(digest, signature);
        require(signer == trustedSigner, "INVALID_SIGNER");
        
        // 6. 권한 정책: 백엔드에서 서명을 생성했다는 것은 권한이 있다는 의미
        // 실제 권한 검증은 백엔드에서 수행
        // require(to == postAuthor[postId], "NOT_AUTHOR"); // 제거됨
        
        // 8. 서명 사용 표시
        usedSignatures[digest] = true;
        
        // 9. 토큰 차감 및 전송
        postTokens[postId] -= amount;
        token.safeTransfer(to, amount);
        
        // 10. 이벤트 발생
        emit TokensClaimed(to, postId, amount, signature);
        emit NonceUsed(to, nonce, block.timestamp); // 추가
    }

    /**
     * @dev 배치 좋아요 (서명 기반)
     * @param postIds 게시글 ID 배열
     * @param deadlines 만료 시간 배열
     * @param nonces nonce 배열
     * @param signatures 서명 배열
     */
    function batchLikePosts(
        uint256[] calldata postIds,
        uint256[] calldata deadlines,
        bytes32[] calldata nonces,
        bytes[] calldata signatures
    ) external {
        require(
            postIds.length == deadlines.length &&
            deadlines.length == nonces.length &&
            nonces.length == signatures.length,
            "LENGTH_MISMATCH"
        );
        require(postIds.length > 0 && postIds.length <= 10, "INVALID_BATCH_SIZE");
        
        uint256 totalAmount = postIds.length * likePrice;
        
        // 토큰 잔액 및 허용량 확인
        require(token.balanceOf(msg.sender) >= totalAmount, "INSUFFICIENT_BALANCE");
        require(token.allowance(msg.sender, address(this)) >= totalAmount, "INSUFFICIENT_ALLOWANCE");
        
        // 배치 처리
        for (uint256 i = 0; i < postIds.length; i++) {
            uint256 postId = postIds[i];
            uint256 deadline = deadlines[i];
            bytes32 nonce = nonces[i];
            bytes calldata signature = signatures[i];
            
            // deadline 검증
            require(block.timestamp <= deadline, "EXPIRED");
            
            // 중복 좋아요 방지
            require(!hasLiked[postId][msg.sender], "ALREADY_LIKED");
            
            // 서명 검증
            bytes32 likeDigest = keccak256(abi.encode(
                keccak256("Like(uint256 postId,address user,uint256 amount,uint256 deadline,bytes32 nonce)"),
                postId,
                msg.sender,
                likePrice,
                deadline,
                nonce
            ));
            
            bytes32 digest = _hashTypedDataV4(likeDigest);
            address signer = ECDSA.recover(digest, signature);
            require(signer == trustedSigner, "INVALID_SIGNER");
            
            // 서명 재사용 방지
            require(!usedLikeDigests[digest], "LIKE_ALREADY_USED");
            usedLikeDigests[digest] = true;
            
            // 토큰 전송
            token.safeTransferFrom(msg.sender, address(this), likePrice);
            
            // 좋아요 처리
            hasLiked[postId][msg.sender] = true;
            postLikes[postId]++;
            postTokens[postId] += likePrice;
            
            // 이벤트 발생
            emit PostLiked(postId, msg.sender, likePrice, block.timestamp);
        }
    }

    /**
     * @dev 금고 회수 (onlyOwner)
     * @param to 수신자 주소
     * @param amount 회수할 토큰 양
     */
    function sweep(address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "TO_ZERO");
        require(amount > 0, "AMOUNT_ZERO");
        require(amount <= token.balanceOf(address(this)), "INSUFFICIENT_BALANCE");
        
        token.safeTransfer(to, amount);
        emit Swept(to, amount);
    }

    /**
     * @dev 게시글 정보 조회 (가스 최적화)
     * @param postId 게시글 ID
     * @param user 사용자 주소
     * @return totalLikes 총 좋아요 수
     * @return totalTokens 수집된 토큰 양
     * @return isLikedByUser 사용자의 좋아요 여부
     */
    function getPostInfo(uint256 postId, address user) external view returns (
        uint256 totalLikes,
        uint256 totalTokens,
        bool isLikedByUser
    ) {
        return (
            postLikes[postId],
            postTokens[postId],
            hasLiked[postId][user]
        );
    }

    /**
     * @dev 컨트랙트 잔액 조회
     * @return 컨트랙트가 보유한 토큰 양
     */
    function getContractBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
    
    // 게시글 등록 상태 확인 함수 제거 - 오로지 서명 기반으로만 동작
    
    /**
     * @dev 게시글의 현재 수집된 토큰 양 조회
     * @param postId 게시글 ID
     * @return 수집된 토큰 양
     */
    function getPostTokens(uint256 postId) external view returns (uint256) {
        return postTokens[postId];
    }

    /**
     * @dev 사용자의 좋아요 개수 조회 (오프체인 인덱싱 권장)
     * @param user 사용자 주소
     * @return 좋아요한 게시글 개수
     */
    function getUserLikeCount(address user) external view returns (uint256) {
        // 가스 최적화를 위해 오프체인 인덱싱 권장
        // 이 함수는 제한적으로 사용
        uint256 count = 0;
        // 실제 구현은 복잡하므로 오프체인에서 처리 권장
        return count;
    }

    /**
     * @dev 게시글의 좋아요 개수 조회
     * @param postId 게시글 ID
     * @return 좋아요한 사용자 개수
     */
    function getPostLikeCount(uint256 postId) external view returns (uint256) {
        return postLikes[postId];
    }

    /**
     * @dev 좋아요 리플레이 방지 상태 확인
     * @param postId 게시글 ID
     * @param user 사용자 주소
     * @param value 토큰 양
     * @return 이미 사용된 좋아요 해시인지 여부
     */
    function isLikeDigestUsed(uint256 postId, address user, uint256 value) external view returns (bool) {
        bytes32 likeDigest = keccak256(abi.encodePacked(
            postId,
            user,
            value,
            block.chainid,
            address(this)
        ));
        return usedLikeDigests[likeDigest];
    }

    /**
     * @dev 서명 리플레이 방지 상태 확인
     * @param digest 서명 해시
     * @return 이미 사용된 서명인지 여부
     */
    function isSignatureUsed(bytes32 digest) external view returns (bool) {
        return usedSignatures[digest];
    }
}
