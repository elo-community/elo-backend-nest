// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TrivusEXP
 * @dev Trivus 서비스 전용 EXP 토큰 with TrustedSigner 서명 검증 및 EIP-2612 permit 지원
 * - 총 공급량: 5000 EXP
 * - Decimals: 18
 * - 초기 발행: 컨트랙트 자체가 5000 EXP 보유
 * - TrustedSigner 서명을 통한 안전한 토큰 지급
 * - EIP-2612 permit을 통한 가스비 없는 approve
 */
contract TrivusEXP {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public nonces;
    
    // EIP-712 도메인 분리자
    bytes32 public constant PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 public constant CLAIM_TYPEHASH = keccak256("Claim(address to,uint256 amount,uint256 deadline)");
    
    // TrustedSigner 주소 (백엔드에서 관리)
    address public trustedSigner;
    address public owner;
    
    // 이미 사용된 서명을 방지하기 위한 nonce
    mapping(bytes32 => bool) public usedSignatures;
    
    // 이벤트
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event TrustedSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event TokensClaimed(address indexed to, uint256 amount, bytes32 indexed signatureHash);
    

    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        name = "Trivus EXP Token";
        symbol = "EXP";
        decimals = 18;
        owner = msg.sender;
        trustedSigner = msg.sender;
        
        // 초기 발행된 5000 EXP를 컨트랙트 자체가 보유
        totalSupply = 5000 * 10**18;
        balanceOf[address(this)] = totalSupply;
        emit Transfer(address(0), address(this), totalSupply);
    }
    
    /**
     * @dev EIP-2612 permit 함수 - 서명을 통한 approve
     * @param _owner 토큰 소유자
     * @param spender 사용할 주소
     * @param value 허용할 토큰 양
     * @param deadline 서명 만료 시간
     * @param v, r, s 서명 값들
     */
    function permit(
        address _owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(deadline >= block.timestamp, "Permit expired");
        require(_owner != address(0), "Invalid owner");
        
        bytes32 structHash = keccak256(abi.encode(PERMIT_TYPEHASH, _owner, spender, value, nonces[_owner], deadline));
        bytes32 domainSeparator = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes(name)),
            keccak256(bytes("1")),
            block.chainid,
            address(this)
        ));
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        address signer = ecrecover(hash, v, r, s);
        
        require(signer == _owner, "Invalid signature");
        
        nonces[_owner]++;
        allowance[_owner][spender] = value;
        emit Approval(_owner, spender, value);
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
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", keccak256(abi.encode("Trivus EXP Token", "1", block.chainid, address(this))), structHash));
        address signer = ecrecover(hash, uint8(signature[0]), bytes32(signature[1:33]), bytes32(signature[33:65]));
        
        require(signer == trustedSigner, "Invalid signature");
        
        // 중복 사용 방지
        bytes32 signatureHash = keccak256(signature);
        require(!usedSignatures[signatureHash], "Signature already used");
        usedSignatures[signatureHash] = true;
        
        // 컨트랙트에서 직접 토큰 지급
        require(balanceOf[address(this)] >= amount, "Insufficient contract balance");
        balanceOf[address(this)] -= amount;
        balanceOf[to] += amount;
        emit Transfer(address(this), to, amount);
        
        emit TokensClaimed(to, amount, signatureHash);
    }
    
    /**
     * @dev 토큰 전송
     */
    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    /**
     * @dev approve
     */
    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    /**
     * @dev transferFrom
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
    
    /**
     * @dev 추가 토큰 발행 (Owner만 가능)
     * @param to 발행할 주소
     * @param amount 발행할 양
     */
    function mint(address to, uint256 amount) external onlyOwner {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
    
    /**
     * @dev 토큰 소각 (Owner만 가능)
     * @param amount 소각할 양
     */
    function burn(uint256 amount) external onlyOwner {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
    
    /**
     * @dev 특정 주소의 토큰 소각
     * @param from 소각할 주소
     * @param amount 소각할 양
     */
    function burnFrom(address from, uint256 amount) external onlyOwner {
        require(balanceOf[from] >= amount, "Insufficient balance");
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
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
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", keccak256(abi.encode("Trivus EXP Token", "1", block.chainid, address(this))), structHash));
        address signer = ecrecover(hash, uint8(signature[0]), bytes32(signature[1:33]), bytes32(signature[33:65]));
        
        return signer == trustedSigner;
    }
    
    /**
     * @dev 컨트랙트 잔액 조회
     * @return 컨트랙트가 보유한 토큰 양
     */
    function getContractBalance() external view returns (uint256) {
        return balanceOf[address(this)];
    }
} 