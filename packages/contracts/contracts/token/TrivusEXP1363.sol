// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC1363Receiver} from "@openzeppelin/contracts/interfaces/IERC1363Receiver.sol";

/**
 * @title TrivusEXP1363
 * @dev ERC-1363을 지원하는 TrivusEXP 토큰 + EIP-712 클레임 기능
 * transferAndCall을 통해 콜백 기반 좋아요 시스템 지원
 * EIP-712 서명을 통한 토큰 클레임 시스템 지원
 */
contract TrivusEXP1363 is ERC20, AccessControl, EIP712, IERC1363Receiver {
    using ECDSA for bytes32;

    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    
    // EIP-712 클레임 관련
    mapping(address => uint256) public nonces;
    bytes32 public constant CLAIM_TYPEHASH = keccak256("Claim(address to,uint256 amount,uint256 nonce,uint256 deadline,uint256 chainId,address contractAddr)");
    // 리플레이 방지: 사용된 서명 다이제스트 기록
    mapping(bytes32 => bool) public usedClaimDigests;
    
    // 이벤트
    event ClaimExecuted(address indexed to, uint256 amount, uint256 nonce, bytes signature);
    event SignerRoleGranted(address indexed signer);
    event SignerRoleRevoked(address indexed signer);

    /**
     * @dev 생성자
     * @param name 토큰 이름
     * @param symbol 토큰 심볼
     * @param signer 서명 권한을 가진 주소
     */
    constructor(
        string memory name, 
        string memory symbol, 
        address signer
    ) ERC20(name, symbol) EIP712(name, "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SIGNER_ROLE, signer);
    }

    /**
     * @dev EIP-712 클레임 함수
     * @param to 받을 주소
     * @param amount 클레임할 양
     * @param nonce 리플레이 방지용 nonce
     * @param deadline 만료 시간
     * @param signature EIP-712 서명
     */
    function claim(
        address to,
        uint256 amount,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(block.timestamp <= deadline, "Expired");
        require(msg.sender == to, "Only receiver");
        
        bytes32 structHash = keccak256(abi.encode(
            CLAIM_TYPEHASH,
            to,
            amount,
            nonce,
            deadline,
            block.chainid,
            address(this)
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        // 동일 서명 다이제스트 재사용 방지
        require(!usedClaimDigests[hash], "Claim already used");
        address signer = hash.recover(signature);
        
        require(hasRole(SIGNER_ROLE, signer), "Invalid signer");
        usedClaimDigests[hash] = true;
        
        _mint(to, amount);
        
        emit ClaimExecuted(to, amount, nonce, signature);
    }

    /**
     * @dev 서명자 역할 부여 (Admin만)
     * @param signer 서명자 주소
     */
    function grantSignerRole(address signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(SIGNER_ROLE, signer);
        emit SignerRoleGranted(signer);
    }

    /**
     * @dev 서명자 역할 해제 (Admin만)
     * @param signer 서명자 주소
     */
    function revokeSignerRole(address signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(SIGNER_ROLE, signer);
        emit SignerRoleRevoked(signer);
    }

    /**
     * @dev 현재 nonce 조회
     * @param user 사용자 주소
     * @return 현재 nonce 값
     */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    /**
     * @dev 테스트용 토큰 발행 (Admin만)
     * @param to 받을 주소
     * @param amount 발행할 양
     */
    function mint(address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(to, amount);
    }

    /**
     * @dev ERC-1363 transferAndCall 구현
     * @param to 받을 주소
     * @param value 전송할 양
     * @param data 콜백에 전달할 데이터
     * @return 성공 여부
     */
    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool) {
        _transfer(msg.sender, to, value);
        _callOnTransferReceived(msg.sender, msg.sender, to, value, data);
        return true;
    }

    /**
     * @dev 내부 콜백 호출 헬퍼
     * @param operator 호출자
     * @param from 보낸 주소
     * @param to 받을 주소
     * @param value 전송된 양
     * @param data 콜백 데이터
     */
    function _callOnTransferReceived(
        address operator,
        address from,
        address to,
        uint256 value,
        bytes calldata data
    ) internal {
        try IERC1363Receiver(to).onTransferReceived(operator, from, value, data) returns (bytes4 retval) {
            require(retval == IERC1363Receiver.onTransferReceived.selector, "1363: bad receiver");
        } catch Error(string memory reason) {
            // 에러 메시지를 그대로 전파
            revert(reason);
        } catch {
            // 기타 에러 (예: custom error)
            revert("1363: non receiver");
        }
    }

    /**
     * @dev ERC-1363 Receiver 인터페이스 구현
     * @param operator 호출자
     * @param from 보낸 주소
     * @param value 전송된 양
     * @param data 콜백 데이터
     * @return 선택자
     */
    function onTransferReceived(
        address operator,
        address from,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        return IERC1363Receiver.onTransferReceived.selector;
    }

    /**
     * @dev 컨트랙트가 ERC-1363 Receiver를 지원하는지 확인
     * @return 지원 여부
     */
    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return interfaceId == type(IERC1363Receiver).interfaceId || super.supportsInterface(interfaceId);
    }
}
