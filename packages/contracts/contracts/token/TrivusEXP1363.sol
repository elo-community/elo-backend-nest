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

    // === Nonce ===
    mapping(address => uint256) public nonces;

    // === EIP-712 claim ===
    mapping(bytes32 => bool) public usedClaimDigests;
    address public trustedSigner;

    bytes32 public constant CLAIM_TYPEHASH = keccak256(
        "Claim(address to,uint256 amount,uint256 deadline,bytes32 nonce)"
    );

    event ClaimExecuted(address indexed to, uint256 amount, uint256 deadline, bytes32 nonce);
    event TrustedSignerUpdated(address indexed oldSigner, address indexed newSigner);

    constructor()
        ERC20("TrivusEXP1363", "EXP")
        Ownable(msg.sender)
        EIP712("TrivusEXP1363", "1")
    {
        _mint(msg.sender, 1_000_000 * 10**decimals());
        trustedSigner = msg.sender;
    }

    // ===== EIP-712 Claim Function =====
    function claimWithSignature(
        address to,
        uint256 amount,
        uint256 deadline,
        bytes32 nonce_,
        bytes calldata signature
    ) external nonReentrant returns (bool) {
        require(block.timestamp <= deadline, "EXPIRED");
        require(to != address(0), "INVALID_ADDRESS");
        require(amount > 0, "INVALID_AMOUNT");

        bytes32 structHash = keccak256(abi.encode(CLAIM_TYPEHASH, to, amount, deadline, nonce_));
        bytes32 digest = _hashTypedDataV4(structHash);

        address signer = digest.recover(signature);
        require(signer == trustedSigner, "INVALID_SIGNER");
        require(!usedClaimDigests[digest], "SIGNATURE_ALREADY_USED");
        usedClaimDigests[digest] = true;

        _mint(to, amount);
        emit ClaimExecuted(to, amount, deadline, nonce_);
        return true;
    }

    function setTrustedSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "INVALID_SIGNER");
        address oldSigner = trustedSigner;
        trustedSigner = newSigner;
        emit TrustedSignerUpdated(oldSigner, newSigner);
    }

    // ====== 1363 helpers ======
    // data MUST be abi.encode(expectedNonce, payload) OR abi.encode(postId) for simple cases
    function _decode(bytes memory data) internal pure returns (uint256 expectedNonce, bytes memory payload) {
        require(data.length >= 32, "BAD_DATA"); // minimal length for postId or (nonce, payload)
        
        if (data.length == 32) {
            // postId만 전달된 경우 (nonce = 0으로 처리)
            expectedNonce = 0;
            payload = data;
        } else {
            // (nonce, payload) 형식
            require(data.length >= 64, "BAD_DATA");
            (expectedNonce, payload) = abi.decode(data, (uint256, bytes));
        }
    }

    // ===== ERC-1363: transferAndCall =====
    function transferAndCall(address to, uint256 value) public returns (bool) {
        // no payload / no nonce path (allowed, but no anti-replay)
        _transfer(_msgSender(), to, value);
        _callOnTransferReceived(_msgSender(), _msgSender(), to, value, "");
        return true;
    }

    function transferAndCall(address to, uint256 value, bytes memory data) public returns (bool) {
        (uint256 expectedNonce, bytes memory payload) = _decode(data);
        require(expectedNonce == nonces[_msgSender()], "BAD_NONCE");

        _transfer(_msgSender(), to, value);
        _callOnTransferReceived(_msgSender(), _msgSender(), to, value, payload);

        unchecked { nonces[_msgSender()] += 1; }
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
        (uint256 expectedNonce, bytes memory payload) = _decode(data);
        require(expectedNonce == nonces[from], "BAD_NONCE");

        _spendAllowance(from, _msgSender(), value);
        _transfer(from, to, value);
        _callOnTransferReceived(_msgSender(), from, to, value, payload);

        unchecked { nonces[from] += 1; }
        return true;
    }

    // ===== ERC-1363: approveAndCall =====
    function approveAndCall(address spender, uint256 value) public returns (bool) {
        _approve(_msgSender(), spender, value);
        _callOnApprovalReceived(_msgSender(), spender, value, "");
        return true;
    }

    function approveAndCall(address spender, uint256 value, bytes memory data) public returns (bool) {
        (uint256 expectedNonce, bytes memory payload) = _decode(data);
        require(expectedNonce == nonces[_msgSender()], "BAD_NONCE");

        _approve(_msgSender(), spender, value);
        _callOnApprovalReceived(_msgSender(), spender, value, payload);

        unchecked { nonces[_msgSender()] += 1; }
        return true;
    }

    // ===== internal 1363 calls =====
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

    // Utils
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0) && amount > 0, "bad");
        _mint(to, amount);
    }
}
