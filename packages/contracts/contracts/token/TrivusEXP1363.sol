// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC165, IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {IERC1363} from "@openzeppelin/contracts/interfaces/IERC1363.sol";
import {IERC1363Receiver} from "@openzeppelin/contracts/interfaces/IERC1363Receiver.sol";
import {IERC1363Spender} from "@openzeppelin/contracts/interfaces/IERC1363Spender.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TrivusEXP1363 is ERC20, Ownable, ERC165, IERC1363, EIP712, ReentrancyGuard {
    using ECDSA for bytes32;
    
    // Replay attack 방지를 위한 nonce 시스템
    mapping(address => uint256) public nonces;
    mapping(bytes32 => bool) public usedHashes;
    
    // EIP-712 claim을 위한 상태 변수들
    mapping(bytes32 => bool) public usedClaimDigests;
    address public trustedSigner;
    
    // EIP-712 타입 해시
    bytes32 public constant CLAIM_TYPEHASH = keccak256(
        "Claim(address to,uint256 amount,uint256 deadline,bytes32 nonce)"
    );
    
    // 이벤트
    event ClaimExecuted(address indexed to, uint256 amount, uint256 deadline, bytes32 nonce);
    event TrustedSignerUpdated(address indexed oldSigner, address indexed newSigner);
    
    constructor() ERC20("TrivusEXP1363", "EXP") Ownable(msg.sender) EIP712("TrivusEXP1363", "1") {
        _mint(msg.sender, 1_000_000 * 10**decimals());
        trustedSigner = msg.sender;
    }

    // ===== EIP-712 Claim Function =====
    function claimWithSignature(
        address to,
        uint256 amount,
        uint256 deadline,
        bytes32 nonce,
        bytes calldata signature
    ) external nonReentrant returns (bool) {
        // 1. 만료 시간 검증
        require(block.timestamp <= deadline, "EXPIRED");
        
        // 2. 주소 검증
        require(to != address(0), "INVALID_ADDRESS");
        require(amount > 0, "INVALID_AMOUNT");
        
        // 3. EIP-712 서명 검증
        bytes32 structHash = keccak256(abi.encode(CLAIM_TYPEHASH, to, amount, deadline, nonce));
        bytes32 hash = _hashTypedDataV4(structHash);
        
        // 4. 서명자 검증
        address signer = hash.recover(signature);
        require(signer == trustedSigner, "INVALID_SIGNER");
        
        // 5. Replay attack 방지
        require(!usedClaimDigests[hash], "SIGNATURE_ALREADY_USED");
        usedClaimDigests[hash] = true;
        
        // 6. 토큰 전송
        _mint(to, amount);
        
        // 7. 이벤트 발생
        emit ClaimExecuted(to, amount, deadline, nonce);
        
        return true;
    }

    // ===== Trusted Signer 관리 =====
    function setTrustedSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "INVALID_SIGNER");
        address oldSigner = trustedSigner;
        trustedSigner = newSigner;
        emit TrustedSignerUpdated(oldSigner, newSigner);
    }

    // ===== ERC-1363: transferAndCall =====
    function transferAndCall(address to, uint256 value) public returns (bool) {
        _transfer(_msgSender(), to, value);
        _callOnTransferReceived(_msgSender(), _msgSender(), to, value, "");
        return true;
    }

    function transferAndCall(address to, uint256 value, bytes memory data) public returns (bool) {
        // Replay attack 방지: data에 nonce가 포함되어 있다면 검증
        if (data.length >= 32) {
            bytes32 dataHash = keccak256(abi.encodePacked(to, value, data, nonces[_msgSender()]));
            require(!usedHashes[dataHash], "REPLAY_ATTACK");
            usedHashes[dataHash] = true;
            nonces[_msgSender()]++;
        }
        
        _transfer(_msgSender(), to, value);
        _callOnTransferReceived(_msgSender(), _msgSender(), to, value, data);
        return true;
    }

    // ===== ERC-1363: transferFromAndCall =====
    function transferFromAndCall(address from, address to, uint256 value) public returns (bool) {
        _spendAllowance(from, _msgSender(), value);
        _transfer(from, to, value);
        _callOnTransferReceived(_msgSender(), from, to, value, "");
        return true;
    }

    function transferFromAndCall(address from, address to, uint256 value, bytes memory data) public returns (bool) {
        // Replay attack 방지: data에 nonce가 포함되어 있다면 검증
        if (data.length >= 32) {
            bytes32 dataHash = keccak256(abi.encodePacked(from, to, value, data, nonces[from]));
            require(!usedHashes[dataHash], "REPLAY_ATTACK");
            usedHashes[dataHash] = true;
            nonces[from]++;
        }
        
        _spendAllowance(from, _msgSender(), value);
        _transfer(from, to, value);
        _callOnTransferReceived(_msgSender(), from, to, value, data);
        return true;
    }

    // ===== ERC-1363: approveAndCall =====
    function approveAndCall(address spender, uint256 value) public returns (bool) {
        _approve(_msgSender(), spender, value);
        _callOnApprovalReceived(_msgSender(), spender, value, "");
        return true;
    }

    function approveAndCall(address spender, uint256 value, bytes memory data) public returns (bool) {
        // Replay attack 방지: data에 nonce가 포함되어 있다면 검증
        if (data.length >= 32) {
            bytes32 dataHash = keccak256(abi.encodePacked(spender, value, data, nonces[_msgSender()]));
            require(!usedHashes[dataHash], "REPLAY_ATTACK");
            usedHashes[dataHash] = true;
            nonces[_msgSender()]++;
        }
        
        _approve(_msgSender(), spender, value);
        _callOnApprovalReceived(_msgSender(), spender, value, data);
        return true;
    }

    // ===== internal helpers =====
    function _callOnTransferReceived(
        address operator, address from, address to, uint256 value, bytes memory data
    ) internal {
        if (to.code.length == 0) revert("1363: non-contract");
        try IERC1363Receiver(to).onTransferReceived(operator, from, value, data) returns (bytes4 retval) {
            if (retval != IERC1363Receiver.onTransferReceived.selector) revert("1363: bad receiver");
        } catch (bytes memory reason) {
            if (reason.length == 0) revert("1363: receiver revert");
            assembly { revert(add(32, reason), mload(reason)) }
        }
    }

    function _callOnApprovalReceived(
        address owner_, address spender, uint256 value, bytes memory data
    ) internal {
        if (spender.code.length == 0) revert("1363: bad spender");
        try IERC1363Spender(spender).onApprovalReceived(owner_, value, data) returns (bytes4 retval) {
            if (retval != IERC1363Spender.onApprovalReceived.selector) revert("1363: bad spender");
        } catch (bytes memory reason) {
            if (reason.length == 0) revert("1363: spender revert");
            assembly { revert(add(32, reason), mload(reason)) }
        }
    }

    // ===== ERC165 =====
    function supportsInterface(bytes4 interfaceId) public view override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC1363).interfaceId || super.supportsInterface(interfaceId);
    }

    // (옵션) 운영용 민팅
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0) && amount > 0, "bad");
        _mint(to, amount);
    }
}
