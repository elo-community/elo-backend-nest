// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PostLikeSystem
 * @dev 게시글 좋아요 시스템을 위한 스마트 컨트랙트
 * - 사용자가 좋아요를 누르면 토큰 1개씩 차감
 * - 작성자가 쌓인 토큰을 회수할 수 있음
 * - 중복 좋아요 방지
 * - 배치 트랜잭션으로 approve와 likePost를 한 번에 처리
 */
contract PostLikeSystem {
    // TrivusEXP 토큰 컨트랙트 주소
    address public trivusToken;
    
    // 컨트랙트 소유자
    address public owner;
    
    // 토큰 차감량 (1 TRIVUS = 1 ether)
    uint256 public constant TOKEN_AMOUNT = 1 ether;
    
    // 게시글별 좋아요 정보
    struct PostLikeInfo {
        uint256 totalLikes;           // 총 좋아요 수
        uint256 totalTokensCollected; // 수집된 총 토큰 수
        mapping(address => bool) hasLiked; // 사용자별 좋아요 여부
        mapping(address => uint256) likeTimestamp; // 좋아요 시간
    }
    
    // 게시글 ID => 좋아요 정보
    mapping(uint256 => PostLikeInfo) public postLikes;
    
    // 사용자별 좋아요한 게시글 목록
    mapping(address => uint256[]) public userLikedPosts;
    
    // 이벤트 정의
    event PostLiked(
        address indexed user,
        uint256 indexed postId,
        uint256 timestamp,
        uint256 totalLikes,
        uint256 totalTokensCollected
    );
    
    event PostUnliked(
        address indexed user,
        uint256 indexed postId,
        uint256 timestamp,
        uint256 totalLikes,
        uint256 totalTokensCollected
    );
    
    event TokensWithdrawn(
        address indexed postAuthor,
        uint256 indexed postId,
        uint256 amount,
        uint256 remainingTokens
    );
    
    event PostLikeEvent(
        address indexed user,
        uint256 indexed postId,
        uint256 amount,
        bool isLike
    );
    
    // 수정자
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor(address _trivusToken) {
        trivusToken = _trivusToken;
        owner = msg.sender;
    }
    
    /**
     * @dev 게시글에 좋아요를 누름 (기존 방식)
     * @param postId 게시글 ID
     * @param postAuthor 게시글 작성자 주소
     */
    function likePost(uint256 postId, address postAuthor) external {
        require(postAuthor != address(0), "Invalid post author");
        require(postAuthor != msg.sender, "Cannot like your own post");
        
        PostLikeInfo storage postInfo = postLikes[postId];
        
        // 이미 좋아요를 누른 경우 에러
        require(!postInfo.hasLiked[msg.sender], "Already liked this post");
        
        // 사용자의 토큰 잔액 확인 (TrivusEXP 컨트랙트 호출)
        uint256 userBalance = IERC20(trivusToken).balanceOf(msg.sender);
        require(userBalance >= TOKEN_AMOUNT, "Insufficient tokens");
        
        // 토큰 전송 (1개 = 1 ether)
        bool success = IERC20(trivusToken).transferFrom(msg.sender, address(this), TOKEN_AMOUNT);
        require(success, "Token transfer failed");
        
        // 좋아요 정보 업데이트
        postInfo.hasLiked[msg.sender] = true;
        postInfo.likeTimestamp[msg.sender] = block.timestamp;
        postInfo.totalLikes++;
        postInfo.totalTokensCollected += TOKEN_AMOUNT;
        
        // 사용자의 좋아요한 게시글 목록에 추가
        userLikedPosts[msg.sender].push(postId);
        
        // 이벤트 발생
        emit PostLiked(msg.sender, postId, block.timestamp, postInfo.totalLikes, postInfo.totalTokensCollected);
        emit PostLikeEvent(msg.sender, postId, TOKEN_AMOUNT, true);
    }
    
    /**
     * @dev 배치 트랜잭션: approve와 likePost를 한 번에 처리
     * @param postId 게시글 ID
     * @param postAuthor 게시글 작성자 주소
     */
    function likePostWithApprove(uint256 postId, address postAuthor) external {
        require(postAuthor != address(0), "Invalid post author");
        require(postAuthor != msg.sender, "Cannot like your own post");
        
        PostLikeInfo storage postInfo = postLikes[postId];
        
        // 이미 좋아요를 누른 경우 에러
        require(!postInfo.hasLiked[msg.sender], "Already liked this post");
        
        // 사용자의 토큰 잔액 확인
        uint256 userBalance = IERC20(trivusToken).balanceOf(msg.sender);
        require(userBalance >= TOKEN_AMOUNT, "Insufficient tokens");
        
        // 현재 허용량 확인
        uint256 currentAllowance = IERC20(trivusToken).allowance(msg.sender, address(this));
        
        // 허용량이 부족하면 에러 (프론트엔드에서 미리 approve 처리 필요)
        require(
            currentAllowance >= TOKEN_AMOUNT,
            "Insufficient allowance. Please approve tokens first."
        );
        
        // 토큰 전송
        bool success = IERC20(trivusToken).transferFrom(msg.sender, address(this), TOKEN_AMOUNT);
        require(success, "Token transfer failed");
        
        // 좋아요 정보 업데이트
        postInfo.hasLiked[msg.sender] = true;
        postInfo.likeTimestamp[msg.sender] = block.timestamp;
        postInfo.totalLikes++;
        postInfo.totalTokensCollected += TOKEN_AMOUNT;
        
        // 사용자의 좋아요한 게시글 목록에 추가
        userLikedPosts[msg.sender].push(postId);
        
        // 이벤트 발생
        emit PostLiked(msg.sender, postId, block.timestamp, postInfo.totalLikes, postInfo.totalTokensCollected);
        emit PostLikeEvent(msg.sender, postId, TOKEN_AMOUNT, true);
    }
    
    /**
     * @dev permit을 사용한 좋아요: 서명만으로 approve와 likePost를 한 번에 처리
     * @param postId 게시글 ID
     * @param postAuthor 게시글 작성자 주소
     * @param deadline permit 서명 만료 시간
     * @param v, r, s permit 서명 값들
     */
    function likePostWithPermit(
        uint256 postId,
        address postAuthor,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(postAuthor != address(0), "Invalid post author");
        require(postAuthor != msg.sender, "Cannot like your own post");
        
        PostLikeInfo storage postInfo = postLikes[postId];
        
        // 이미 좋아요를 누른 경우 에러
        require(!postInfo.hasLiked[msg.sender], "Already liked this post");
        
        // 사용자의 토큰 잔액 확인
        uint256 userBalance = IERC20(trivusToken).balanceOf(msg.sender);
        require(userBalance >= TOKEN_AMOUNT, "Insufficient tokens");
        
        // permit을 통해 approve 처리 (현재는 비활성화)
        // msg.sender가 서명을 생성한 사용자여야 함
        // IERC20Permit(trivusToken).permit(
        //     msg.sender, // owner: 서명을 생성한 사용자
        //     address(this), // spender: PostLikeSystem 컨트랙트
        //     TOKEN_AMOUNT, // value: 1 EXP
        //     deadline,
        //     v, r, s
        // );
        
        // 현재 허용량 확인 (permit 대신)
        uint256 currentAllowance = IERC20(trivusToken).allowance(msg.sender, address(this));
        require(
            currentAllowance >= TOKEN_AMOUNT,
            "Insufficient allowance. Please approve tokens first."
        );
        
        // 토큰 전송
        bool success = IERC20(trivusToken).transferFrom(msg.sender, address(this), TOKEN_AMOUNT);
        require(success, "Token transfer failed");
        
        // 좋아요 정보 업데이트
        postInfo.hasLiked[msg.sender] = true;
        postInfo.likeTimestamp[msg.sender] = block.timestamp;
        postInfo.totalLikes++;
        postInfo.totalTokensCollected += TOKEN_AMOUNT;
        
        // 사용자의 좋아요한 게시글 목록에 추가
        userLikedPosts[msg.sender].push(postId);
        
        // 이벤트 발생
        emit PostLiked(msg.sender, postId, block.timestamp, postInfo.totalLikes, postInfo.totalTokensCollected);
        emit PostLikeEvent(msg.sender, postId, TOKEN_AMOUNT, true);
    }
    
    /**
     * @dev 게시글 좋아요 취소
     * @param postId 게시글 ID
     */
    function unlikePost(uint256 postId) external {
        PostLikeInfo storage postInfo = postLikes[postId];
        
        // 좋아요를 누르지 않은 경우 에러
        require(postInfo.hasLiked[msg.sender], "Not liked this post");
        
        // 좋아요 정보 업데이트
        postInfo.hasLiked[msg.sender] = false;
        postInfo.totalLikes--;
        postInfo.totalTokensCollected -= TOKEN_AMOUNT;
        
        // 사용자의 좋아요한 게시글 목록에서 제거
        _removeFromUserLikedPosts(msg.sender, postId);
        
        // 토큰 반환
        bool success = IERC20(trivusToken).transfer(msg.sender, TOKEN_AMOUNT);
        require(success, "Token refund failed");
        
        // 이벤트 발생
        emit PostUnliked(msg.sender, postId, block.timestamp, postInfo.totalLikes, postInfo.totalTokensCollected);
        emit PostLikeEvent(msg.sender, postId, TOKEN_AMOUNT, false);
    }
    
    /**
     * @dev 게시글 작성자가 쌓인 토큰을 회수
     * @param postId 게시글 ID
     */
    function withdrawTokens(uint256 postId) external {
        PostLikeInfo storage postInfo = postLikes[postId];
        
        // 수집된 토큰이 있는지 확인
        require(postInfo.totalTokensCollected > 0, "No tokens to withdraw");
        
        uint256 amountToWithdraw = postInfo.totalTokensCollected;
        
        // 토큰 수집량 초기화
        postInfo.totalTokensCollected = 0;
        
        // 토큰 전송
        bool success = IERC20(trivusToken).transfer(msg.sender, amountToWithdraw);
        require(success, "Token withdrawal failed");
        
        // 이벤트 발생
        emit TokensWithdrawn(msg.sender, postId, amountToWithdraw, 0);
    }
    
    /**
     * @dev 게시글의 좋아요 정보 조회
     * @param postId 게시글 ID
     * @return totalLikes 총 좋아요 수
     * @return totalTokensCollected 수집된 총 토큰 수
     */
    function getPostLikeInfo(uint256 postId) external view returns (uint256 totalLikes, uint256 totalTokensCollected) {
        PostLikeInfo storage postInfo = postLikes[postId];
        return (postInfo.totalLikes, postInfo.totalTokensCollected);
    }
    
    /**
     * @dev 사용자가 특정 게시글에 좋아요를 눌렀는지 확인
     * @param postId 게시글 ID
     * @param user 사용자 주소
     * @return hasLiked 좋아요 여부
     * @return likeTimestamp 좋아요 시간
     */
    function getUserLikeInfo(uint256 postId, address user) external view returns (bool hasLiked, uint256 likeTimestamp) {
        PostLikeInfo storage postInfo = postLikes[postId];
        return (postInfo.hasLiked[user], postInfo.likeTimestamp[user]);
    }
    
    /**
     * @dev 사용자가 좋아요한 게시글 목록 조회
     * @param user 사용자 주소
     * @return likedPosts 좋아요한 게시글 ID 배열
     */
    function getUserLikedPosts(address user) external view returns (uint256[] memory likedPosts) {
        return userLikedPosts[user];
    }
    
    /**
     * @dev 사용자가 좋아요한 게시글 개수 조회
     * @param user 사용자 주소
     * @return count 좋아요한 게시글 개수
     */
    function getUserLikedPostsCount(address user) external view returns (uint256 count) {
        return userLikedPosts[user].length;
    }
    
    /**
     * @dev 사용자의 좋아요한 게시글 목록에서 특정 게시글 제거
     * @param user 사용자 주소
     * @param postId 제거할 게시글 ID
     */
    function _removeFromUserLikedPosts(address user, uint256 postId) internal {
        uint256[] storage likedPosts = userLikedPosts[user];
        
        for (uint256 i = 0; i < likedPosts.length; i++) {
            if (likedPosts[i] == postId) {
                // 마지막 요소를 현재 위치로 이동하고 배열 길이 감소
                likedPosts[i] = likedPosts[likedPosts.length - 1];
                likedPosts.pop();
                break;
            }
        }
    }
    
    /**
     * @dev 컨트랙트에 보관된 총 토큰 수 조회
     * @return totalTokens 총 토큰 수
     */
    function getContractTokenBalance() external view returns (uint256 totalTokens) {
        return IERC20(trivusToken).balanceOf(address(this));
    }
    
    /**
     * @dev 게시글별 수집된 토큰 수 조회
     * @param postId 게시글 ID
     * @return tokens 수집된 토큰 수
     */
    function getPostCollectedTokens(uint256 postId) external view returns (uint256 tokens) {
        return postLikes[postId].totalTokensCollected;
    }
    
    /**
     * @dev 게시글별 좋아요 수 조회
     * @param postId 게시글 ID
     * @return likes 좋아요 수
     */
    function getPostLikeCount(uint256 postId) external view returns (uint256 likes) {
        return postLikes[postId].totalLikes;
    }
    
    /**
     * @dev 사용자가 PostLikeSystem에 허용한 토큰 양 조회
     * @param user 사용자 주소
     * @return allowance 허용된 토큰 양
     */
    function getUserAllowance(address user) external view returns (uint256 allowance) {
        return IERC20(trivusToken).allowance(user, address(this));
    }
    
    /**
     * @dev 사용자가 좋아요를 위해 필요한 추가 허용량 계산
     * @param user 사용자 주소
     * @return requiredAllowance 추가로 필요한 허용량 (0이면 이미 충분)
     */
    function getRequiredAllowance(address user) external view returns (uint256 requiredAllowance) {
        uint256 currentAllowance = IERC20(trivusToken).allowance(user, address(this));
        
        if (currentAllowance >= TOKEN_AMOUNT) {
            return 0; // 이미 충분한 허용량
        } else {
            return TOKEN_AMOUNT - currentAllowance; // 추가로 필요한 허용량
        }
    }
    
    /**
     * @dev 컨트랙트 소유자 변경
     * @param newOwner 새로운 소유자 주소
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
}

/**
 * @title IERC20
 * @dev ERC20 토큰 인터페이스
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @title IERC20Permit
 * @dev ERC20Permit 토큰 인터페이스
 */
interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}
