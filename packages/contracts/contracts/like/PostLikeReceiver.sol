// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC1363Receiver} from "../token/IERC1363Receiver.sol";

/**
 * @title PostLikeReceiver
 * @dev ERC-1363 콜백을 통해 좋아요를 처리하는 컨트랙트
 * Escrow 모드: 토큰을 임시 보관 후 작성자가 인출
 */
contract PostLikeReceiver is IERC1363Receiver, Ownable {
    /// @dev 토큰 컨트랙트 주소 (불변)
    address public immutable token;
    
    /// @dev 좋아요당 필요한 토큰 양 (1 EXP = 1e18)
    uint256 public constant TOKEN_AMOUNT = 1e18;
    
    /// @dev onTransferReceived 함수의 selector
    bytes4 private constant _ERC1363_RECEIVED = IERC1363Receiver.onTransferReceived.selector;

    /// @dev 게시글 ID -> 작성자 주소
    mapping(uint256 => address) public postAuthor;
    
    /// @dev 게시글 ID -> 총 좋아요 수
    mapping(uint256 => uint256) public postLikes;
    
    /// @dev 게시글 ID -> 사용자 -> 좋아요 여부
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    
    /// @dev 게시글 ID -> 수집된 토큰 양
    mapping(uint256 => uint256) public postTokens;

    /// @dev 게시글 등록 이벤트
    event PostRegistered(uint256 indexed postId, address indexed author);
    
    /// @dev 좋아요 이벤트
    event PostLiked(address indexed user, uint256 indexed postId, uint256 amount);
    
    /// @dev 토큰 인출 이벤트
    event TokensWithdrawn(address indexed author, uint256 indexed postId, uint256 amount);

    /**
     * @dev 생성자
     * @param _token ERC-1363 토큰 컨트랙트 주소
     */
    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "token=0");
        token = _token;
    }

    /**
     * @dev 게시글 등록 (Owner만)
     * @param postId 게시글 ID
     * @param author 작성자 주소
     */
    function registerPost(uint256 postId, address author) external onlyOwner {
        require(author != address(0), "author=0");
        require(postAuthor[postId] == address(0), "already registered");
        
        postAuthor[postId] = author;
        emit PostRegistered(postId, author);
    }

    /**
     * @dev ERC-1363 콜백: 토큰 전송 시 자동 호출
     * @param operator 호출자 (토큰 컨트랙트)
     * @param from 보낸 주소
     * @param value 전송된 양
     * @param data 인코딩된 게시글 ID
     * @return IERC1363Receiver.onTransferReceived.selector
     */
    function onTransferReceived(
        address operator,
        address from,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4) {
        // 보안 검증
        require(msg.sender == token, "invalid token");
        require(value == TOKEN_AMOUNT, "bad amount");

        // 데이터 디코딩
        uint256 postId;
        try this.decodePostId(data) returns (uint256 decodedPostId) {
            postId = decodedPostId;
        } catch {
            revert("invalid data format");
        }
        
        address author = postAuthor[postId];
        
        // 비즈니스 로직 검증
        require(author != address(0), "unregistered post");
        require(from != author, "self-like blocked");
        require(!hasLiked[postId][from], "already liked");

        // 상태 변경 (Effects First)
        hasLiked[postId][from] = true;
        postLikes[postId] += 1;
        postTokens[postId] += value;

        emit PostLiked(from, postId, value);
        
        return _ERC1363_RECEIVED;
    }

    /**
     * @dev 토큰 인출 (게시글 작성자만)
     * @param postId 게시글 ID
     */
    function withdraw(uint256 postId) external {
        address author = postAuthor[postId];
        require(msg.sender == author, "not author");
        
        uint256 amount = postTokens[postId];
        require(amount > 0, "nothing to withdraw");
        
        // 상태 변경 후 토큰 전송 (Effects First)
        postTokens[postId] = 0;
        IERC20(token).transfer(author, amount);
        
        emit TokensWithdrawn(author, postId, amount);
    }

    /**
     * @dev 게시글 정보 조회
     * @param postId 게시글 ID
     * @return author 작성자 주소
     * @return likes 총 좋아요 수
     * @return tokens 수집된 토큰 양
     */
    function getPostInfo(uint256 postId) external view returns (
        address author,
        uint256 likes,
        uint256 tokens
    ) {
        author = postAuthor[postId];
        likes = postLikes[postId];
        tokens = postTokens[postId];
    }

    /**
     * @dev 사용자의 좋아요 정보 조회
     * @param postId 게시글 ID
     * @param user 사용자 주소
     * @return userHasLiked 좋아요 여부
     */
    function getUserLikeInfo(uint256 postId, address user) external view returns (bool userHasLiked) {
        userHasLiked = hasLiked[postId][user];
    }
    
    /**
     * @dev 데이터에서 게시글 ID를 디코딩하는 헬퍼 함수
     * @param data 인코딩된 데이터
     * @return postId 게시글 ID
     */
    function decodePostId(bytes calldata data) external pure returns (uint256 postId) {
        postId = abi.decode(data, (uint256));
    }
}
