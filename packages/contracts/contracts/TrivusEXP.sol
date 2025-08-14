// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title TrivusEXP
 * @dev Trivus 서비스 전용 EXP 토큰 with TrustedSigner 서명 검증
 * - 총 공급량: 5000 EXP
 * - Decimals: 18
 * - 초기 발행: 컨트랙트 자체가 5000 EXP 보유
 * - TrustedSigner 서명을 통한 안전한 토큰 지급
 */
contract TrivusEXP is ERC20, Ownable, EIP712 {
    using ECDSA for bytes32;

    // EIP-712 도메인 분리자
    bytes32 public constant CLAIM_TYPEHASH = keccak256("Claim(address to,uint256 amount,uint256 deadline)");

    // TrustedSigner 주소 (백엔드에서 관리)
    address public trustedSigner;

    // 이미 사용된 서명을 방지하기 위한 nonce
    mapping(bytes32 => bool) public usedSignatures;

    // 이벤트
    event TrustedSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event TokensClaimed(address indexed to, uint256 amount, bytes32 indexed signatureHash);

    constructor() ERC20("Trivus EXP Token", "EXP") Ownable(msg.sender) EIP712("Trivus EXP Token", "1") {
        // 초기 발행된 5000 EXP를 컨트랙트 자체가 보유
        _mint(address(this), 5000 * 10**18);
        trustedSigner = msg.sender; // 초기에는 배포자가 trustedSigner
    }

    /**
     * @dev TrustedSigner 주소 업데이트 (Owner만 가능)
     * @param newSigner 새로운 TrustedSigner 주소
     */
    function updateTrustedSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid signer address");
        address oldSigner = trustedSigner;
        trustedSigner = newSigner;
        emit TrustedSignerUpdated(oldSigner, newSigner);
    }

    /**
     * @dev 서명 검증을 통한 토큰 지급 (컨트랙트가 직접 지급)
     * @param to 토큰을 받을 주소
     * @param amount 지급할 토큰 양
     * @param deadline 서명 만료 시간 (Unix timestamp)
     * @param signature TrustedSigner의 서명
     */
    function claimWithSignature(
        address to,
        uint256 amount,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        require(deadline > block.timestamp, "Signature expired");

        // 서명 검증
        bytes32 structHash = keccak256(abi.encode(CLAIM_TYPEHASH, to, amount, deadline));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);

        require(signer == trustedSigner, "Invalid signature");

        // 중복 사용 방지
        bytes32 signatureHash = keccak256(signature);
        require(!usedSignatures[signatureHash], "Signature already used");
        usedSignatures[signatureHash] = true;

        // 컨트랙트에서 직접 토큰 지급 (transfer 사용)
        require(balanceOf(address(this)) >= amount, "Insufficient contract balance");
        _transfer(address(this), to, amount);

        emit TokensClaimed(to, amount, signatureHash);
    }

    /**
     * @dev 추가 토큰 발행 (Owner만 가능)
     * @param to 발행할 주소
     * @param amount 발행할 양
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev 토큰 소각 (Owner만 가능)
     * @param amount 소각할 양
     */
    function burn(uint256 amount) external onlyOwner {
        _burn(msg.sender, amount);
    }

    /**
     * @dev 특정 주소의 토큰 소각
     * @param from 소각할 주소
     * @param amount 소각할 양
     */
    function burnFrom(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /**
     * @dev 서명이 유효한지 확인 (읽기 전용)
     * @param to 토큰을 받을 주소
     * @param amount 지급할 토큰 양
     * @param deadline 서명 만료 시간
     * @param signature TrustedSigner의 서명
     * @return 유효한 서명인지 여부
     */
    function verifySignature(
        address to,
        uint256 amount,
        uint256 deadline,
        bytes calldata signature
    ) external view returns (bool) {
        if (deadline <= block.timestamp) return false;

        bytes32 structHash = keccak256(abi.encode(CLAIM_TYPEHASH, to, amount, deadline));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);

        return signer == trustedSigner;
    }

    /**
     * @dev 컨트랙트 잔액 조회
     * @return 컨트랙트가 보유한 토큰 양
     */
    function getContractBalance() external view returns (uint256) {
        return balanceOf(address(this));
    }
} 