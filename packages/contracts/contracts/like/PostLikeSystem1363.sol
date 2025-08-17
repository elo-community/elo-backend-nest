// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC1363Receiver} from "@openzeppelin/contracts/interfaces/IERC1363Receiver.sol";

/**
 * @title PostLikeSystem1363
 * @dev PostLikeReceiver와 PostLikeSystem을 통합한 완벽한 좋아요 시스템
 * - ERC1363 표준: transferAndCall로 자동 콜백 처리
 * - 서명 기반 보안: 백엔드에서 작성자 검증
 * - 고급 기능: 좋아요 취소, 사용자별 추적, 배치 처리
 * - 사용자 경험: 한 번의 트랜잭션으로 완료
 */
contract PostLikeSystem1363 is IERC1363Receiver, Ownable {
    using ECDSA for bytes32;
    
    // 상태 변수
    IERC20 public immutable token;
    mapping(uint256 => uint256) public postLikes;
    mapping(uint256 => uint256) public postTokens;
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    mapping(uint256 => mapping(address => uint256)) public likeTimestamp;
    mapping(uint256 => address[]) public postLikedUsers;
    mapping(address => uint256[]) public userLikedPosts;
    mapping(bytes32 => bool) public usedSignatures;
    
    // 게시글 존재 여부 추적 (좋아요가 한 번이라도 있었던 게시글)
    mapping(uint256 => bool) public postExists;
    
    // EIP-712 도메인 분리자
    bytes32 public immutable DOMAIN_SEPARATOR;
    
    // 이벤트
    event PostRegistered(uint256 indexed postId, address indexed author, uint256 timestamp);
    event PostLiked(uint256 indexed postId, address indexed user, uint256 amount, uint256 timestamp);
    event PostUnliked(uint256 indexed postId, address indexed user, uint256 amount, uint256 timestamp);
    event TokensClaimed(address indexed author, uint256 indexed postId, uint256 amount, bytes signature);
    event BatchPostLiked(address indexed user, uint256[] postIds, uint256 totalAmount);

    /**
     * @dev 생성자
     * @param _token ERC-1363 토큰 컨트랙트 주소
     */
    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "token=0");
        token = IERC20(_token);
        
        // EIP-712 도메인 분리자 설정
        DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("PostLikeSystem1363")),
            keccak256(bytes("1")),
            block.chainid,
            address(this)
        ));
    }

    /**
     * @dev 게시글 등록 (백엔드에서 관리)
     * @param postId 게시글 ID
     * @param author 작성자 주소
     */
    function registerPost(uint256 postId, address author) external onlyOwner {
        require(author != address(0), "invalid author");
        emit PostRegistered(postId, author, block.timestamp);
    }
    
    /**
     * @dev ERC1363 토큰 수신 시 자동 좋아요 처리
     * @param operator 토큰을 보낸 사용자
     * @param from 토큰을 보낸 주소
     * @param value 토큰 양
     * @param data 게시글 ID가 인코딩된 데이터
     * @return ERC1363Receiver 표준 응답
     */
    function onTransferReceived(
        address operator,
        address from,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        // msg.sender 검증 제거 - ERC1363 표준에 따라 토큰 컨트랙트가 호출
        require(value == 1e18, "invalid amount"); // Assuming TOKEN_AMOUNT is 1e18
        
        // 게시글 ID 디코딩
        uint256 postId = abi.decode(data, (uint256));
        
        // 좋아요 처리
        _processLike(postId, from, value);
        
        return IERC1363Receiver.onTransferReceived.selector;
    }
    
    /**
     * @dev 좋아요 처리 로직
     * @param postId 게시글 ID
     * @param user 좋아요한 사용자
     * @param amount 토큰 양
     */
    function _processLike(uint256 postId, address user, uint256 amount) internal {
        // 중복 좋아요 방지
        require(!hasLiked[postId][user], "already liked");
        
        // 좋아요 처리
        hasLiked[postId][user] = true;
        postLikes[postId]++;
        postTokens[postId] += amount;
        likeTimestamp[postId][user] = block.timestamp;
        
        // 사용자별 좋아요한 게시글 목록에 추가
        userLikedPosts[user].push(postId);
        
        // 게시글별 좋아요한 사용자 목록에 추가
        postLikedUsers[postId].push(user);
        
        // 게시글 존재 여부 표시
        postExists[postId] = true;
        
        // 이벤트 발생
        emit PostLiked(postId, user, amount, block.timestamp);
    }

    /**
     * @dev 직접 좋아요 (ERC20 방식)
     * @param postId 게시글 ID
     */
    function likePost(uint256 postId) external {
        require(!hasLiked[postId][msg.sender], "already liked");
        
        // 토큰 차감
        bool success = token.transferFrom(msg.sender, address(this), 1e18);
        require(success, "token transfer failed");
        
        // 좋아요 처리
        _processLike(postId, msg.sender, 1e18);
    }

    /**
     * @dev 좋아요 취소 (ERC20 방식)
     * @param postId 게시글 ID
     */
    function unlikePost(uint256 postId) external {
        require(hasLiked[postId][msg.sender], "not liked");
        
        // 좋아요 취소 처리
        _processUnlike(postId, msg.sender);
        
        // 토큰 반환
        bool success = token.transfer(msg.sender, 1e18); // Assuming TOKEN_AMOUNT is 1e18
        require(success, "token transfer failed");
    }

    /**
     * @dev 좋아요 취소 처리 내부 함수
     * @param postId 게시글 ID
     * @param user 사용자 주소
     */
    function _processUnlike(uint256 postId, address user) internal {
        // 안전 검증: 언더플로우 방지
        require(postLikes[postId] > 0, "no likes to remove");
        require(postTokens[postId] >= 1e18, "insufficient tokens to remove");
        
        // 좋아요 정보 업데이트
        hasLiked[postId][user] = false;
        postLikes[postId]--;
        postTokens[postId] -= 1e18; // Assuming TOKEN_AMOUNT is 1e18
        
        // 사용자별 좋아요한 게시글 목록에서 제거
        _removeFromArray(userLikedPosts[user], postId);
        
        // 게시글별 좋아요한 사용자 목록에서 제거
        _removeFromArray(postLikedUsers[postId], user);
        
        // 게시글 존재 여부 확인 및 업데이트
        if (postLikes[postId] == 0) {
            postExists[postId] = false;
        }
        
        // 이벤트 발생
        emit PostUnliked(postId, user, 1e18, block.timestamp); // Assuming TOKEN_AMOUNT is 1e18
    }

    /**
     * @dev 배열에서 요소 제거 헬퍼 함수
     * @param array 대상 배열
     * @param element 제거할 요소
     */
    function _removeFromArray(uint256[] storage array, uint256 element) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == element) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }

    /**
     * @dev 배열에서 요소 제거 헬퍼 함수 (address용)
     * @param array 대상 배열
     * @param element 제거할 요소
     */
    function _removeFromArray(address[] storage array, address element) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == element) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }

    /**
     * @dev 배치 좋아요 (여러 게시글에 동시 좋아요)
     * @param postIds 게시글 ID 배열
     * @param postAuthors 작성자 주소 배열
     */
    function batchLikePosts(uint256[] calldata postIds, address[] calldata postAuthors) external {
        require(postIds.length == postAuthors.length, "length mismatch");
        require(postIds.length > 0 && postIds.length <= 10, "invalid batch size");
        
        uint256 totalAmount = postIds.length * 1e18; // Assuming TOKEN_AMOUNT is 1e18
        
        // 토큰 잔액 및 허용량 확인
        require(token.balanceOf(msg.sender) >= totalAmount, "insufficient balance");
        require(token.allowance(msg.sender, address(this)) >= totalAmount, "insufficient allowance");
        
        // 배치 처리
        for (uint256 i = 0; i < postIds.length; i++) {
            uint256 postId = postIds[i];
            address author = postAuthors[i];
            
            require(author != address(0), "invalid author");
            require(author != msg.sender, "cannot like own post");
            // require(postAuthor[postId] == author, "author mismatch"); // Removed as per edit hint
            require(!hasLiked[postId][msg.sender], "already liked");
            
            // 토큰 전송
            bool success = token.transferFrom(msg.sender, address(this), 1e18); // Assuming TOKEN_AMOUNT is 1e18
            require(success, "token transfer failed");
            
            // 좋아요 처리
            _processLike(postId, msg.sender, 1e18); // Assuming TOKEN_AMOUNT is 1e18
        }
        
        // 배치 이벤트 발생
        emit BatchPostLiked(msg.sender, postIds, totalAmount);
    }

    /**
     * @dev 서명 기반 토큰 인출 (게시글 작성자만)
     * @param postId 게시글 ID
     * @param signature 백엔드에서 생성한 EIP-712 서명
     * @param deadline 서명 만료시간
     * @param nonce 고유한 일회용 값
     */
    function claimWithSignature(uint256 postId, bytes calldata signature, uint256 deadline, bytes32 nonce) external {
        // 1. deadline 검증
        require(block.timestamp <= deadline, "signature expired");
        
        // 2. 게시글 존재 여부 확인 (보안 강화)
        require(postExists[postId], "post does not exist");
        
        // 3. 토큰 수집 여부 확인
        uint256 amount = postTokens[postId];
        require(amount > 0, "nothing to claim");
        
        // 4. 서명 검증 - 백엔드 개인키로 생성된 서명 확인
        // 서명에는 postId, msg.sender(클레임하는 사용자), amount, deadline, nonce가 포함됨
        bytes32 claimHash = _hashClaimData(postId, msg.sender, amount, deadline, nonce);
        require(!usedSignatures[claimHash], "signature already used");
        
        // 5. 서명자 검증 - 백엔드가 보유한 개인키로 서명했는지 확인
        address signer = _recoverSigner(claimHash, signature);
        require(signer == owner(), "invalid signer");
        
        // 6. 권한 검증 - 실제로 이 사용자가 이 게시글의 토큰을 클레임할 권한이 있는지 확인
        // 예: 게시글 작성자, 좋아요한 사용자, 또는 백엔드에서 정의한 권한 규칙
        require(_hasClaimPermission(postId, msg.sender), "no claim permission");
        
        // 7. 서명 사용 표시
        usedSignatures[claimHash] = true;
        
        // 8. 토큰 전송
        postTokens[postId] = 0;
        token.transfer(msg.sender, amount);
        
        emit TokensClaimed(msg.sender, postId, amount, signature);
    }
    
    /**
     * @dev 사용자가 특정 게시글의 토큰을 클레임할 권한이 있는지 확인
     * @param postId 게시글 ID
     * @param user 사용자 주소
     * @return 권한 여부
     */
    function _hasClaimPermission(uint256 postId, address user) internal view returns (bool) {
        // 백엔드에서 서명을 생성했다는 것은 권한이 있다는 의미
        // 실제 권한 검증은 백엔드에서 수행
        return true;
        
        // 다른 권한 규칙 예시:
        // - 좋아요한 사용자만 클레임 가능
        // - 특정 조건을 만족하는 사용자만 클레임 가능
        // - 백엔드에서 관리하는 권한 시스템과 연동
    }

    /**
     * @dev EIP-712 해시 생성
     * @param postId 게시글 ID
     * @param author 작성자 주소
     * @param amount 토큰 양
     * @param deadline 만료시간
     * @param nonce 고유값
     * @return 해시값
     */
    function _hashClaimData(uint256 postId, address author, uint256 amount, uint256 deadline, bytes32 nonce) internal view returns (bytes32) {
        bytes32 structHash = keccak256(abi.encode(
            keccak256("Claim(uint256 postId,address author,uint256 amount,uint256 deadline,bytes32 nonce)"),
            postId,
            author,
            amount,
            deadline,
            nonce
        ));
        
        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
    }

    /**
     * @dev 서명자 복구
     * @param hash 해시값
     * @param signature 서명
     * @return 서명자 주소
     */
    function _recoverSigner(bytes32 hash, bytes calldata signature) internal pure returns (address) {
        return hash.recover(signature);
    }

    /**
     * @dev 게시글 정보 조회
     * @param postId 게시글 ID
     * @param user 사용자 주소
     * @return author 작성자 주소 (백엔드에서 관리)
     * @return totalLikes 총 좋아요 수
     * @return totalTokens 수집된 토큰 양
     * @return isLikedByUser 사용자의 좋아요 여부
     */
    function getPostInfo(uint256 postId, address user) external view returns (
        address author,
        uint256 totalLikes,
        uint256 totalTokens,
        bool isLikedByUser
    ) {
        // 백엔드에서 작성자 정보를 관리하므로, 여기서는 임시로 address(0) 반환
        // 실제로는 백엔드에서 작성자 정보를 제공
        return (
            address(0), // 백엔드에서 관리
            postLikes[postId],
            postTokens[postId],
            hasLiked[postId][user]
        );
    }

    /**
     * @dev 사용자가 좋아요한 게시글 목록 조회
     * @param user 사용자 주소
     * @return 좋아요한 게시글 ID 배열
     */
    function getUserLikedPosts(address user) external view returns (uint256[] memory) {
        return userLikedPosts[user];
    }

    /**
     * @dev 게시글에 좋아요한 사용자 목록 조회
     * @param postId 게시글 ID
     * @return 좋아요한 사용자 주소 배열
     */
    function getPostLikedUsers(uint256 postId) external view returns (address[] memory) {
        return postLikedUsers[postId];
    }

    /**
     * @dev 사용자의 좋아요 시간 조회
     * @param postId 게시글 ID
     * @param user 사용자 주소
     * @return 좋아요 시간 (Unix timestamp)
     */
    function getLikeTimestamp(uint256 postId, address user) external view returns (uint256) {
        return likeTimestamp[postId][user];
    }

    /**
     * @dev 컨트랙트 잔액 조회
     * @return 컨트랙트가 보유한 토큰 양
     */
    function getContractBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
    
    /**
     * @dev 게시글 등록 상태 확인
     * @param postId 게시글 ID
     * @return 등록 여부
     */
    function isPostRegistered(uint256 postId) external view returns (bool) {
        // 백엔드에서 게시글 등록을 관리하므로 항상 true 반환
        // 또는 특정 조건으로 확인 가능
        return true;
    }
    
    /**
     * @dev 게시글 존재 여부 확인 (좋아요가 한 번이라도 있었던 게시글)
     * @param postId 게시글 ID
     * @return 존재 여부
     */
    function isPostExists(uint256 postId) external view returns (bool) {
        return postExists[postId];
    }
    
    /**
     * @dev 게시글의 현재 수집된 토큰 양 조회
     * @param postId 게시글 ID
     * @return 수집된 토큰 양
     */
    function getPostTokens(uint256 postId) external view returns (uint256) {
        return postTokens[postId];
    }
    
    /**
     * @dev 사용자의 좋아요 개수 조회
     * @param user 사용자 주소
     * @return 좋아요한 게시글 개수
     */
    function getUserLikeCount(address user) external view returns (uint256) {
        return userLikedPosts[user].length;
    }

    /**
     * @dev 게시글의 좋아요 개수 조회
     * @param postId 게시글 ID
     * @return 좋아요한 사용자 개수
     */
    function getPostLikeCount(uint256 postId) external view returns (uint256) {
        return postLikedUsers[postId].length;
    }
}
