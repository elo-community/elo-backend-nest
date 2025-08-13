// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./RewardPool.sol";

/**
 * @title SignedRewardDistributor
 * @dev Handles EIP-712 signed reward claims with pre-funded pool
 */
contract SignedRewardDistributor is 
    Initializable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable, 
    UUPSUpgradeable
{
    using ECDSA for bytes32;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    
    // EIP-712 domain separator - will be set in initialize
    bytes32 public DOMAIN_SEPARATOR;

    RewardPool public rewardPool;
    
    struct Distribution {
        address token;
        uint256 total;        // cap for this distribution
        uint256 remaining;    // starts == total, decreases on claims
        uint256 snapshotBlock;
        uint256 deadline;     // unix seconds
        bool active;
    }

    mapping(uint256 => Distribution) public dists;
    mapping(uint256 => mapping(address => uint256)) public claimed; // cumulative model

    event DistributionCreated(
        uint256 indexed id, 
        address indexed token, 
        uint256 total, 
        uint256 snapshotBlock, 
        uint256 deadline
    );
    event Claimed(
        uint256 indexed id, 
        address indexed account, 
        uint256 amount, 
        uint256 newClaimedTotal
    );

    error DistributionNotFound();
    error DistributionInactive();
    error DeadlineExpired();
    error InvalidDeadline();
    error InsufficientRemaining();
    error NoAmountToClaim();
    error InvalidSignature();
    error UnauthorizedSigner();
    error InvalidAmount();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _rewardPool, 
        address admin, 
        address signer
    ) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        rewardPool = RewardPool(_rewardPool);
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(SIGNER_ROLE, signer);
        
        // Initialize EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("SignedRewardDistributor")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @dev Create a new distribution (admin only)
     */
    function createDistribution(
        uint256 id,
        address token,
        uint256 total,
        uint256 snapshotBlock,
        uint256 deadline
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (token == address(0)) revert InvalidAmount();
        if (total == 0) revert InvalidAmount();
        if (deadline <= block.timestamp) revert InvalidDeadline();
        if (dists[id].active) revert DistributionNotFound(); // id already exists
        
        dists[id] = Distribution({
            token: token,
            total: total,
            remaining: total,
            snapshotBlock: snapshotBlock,
            deadline: deadline,
            active: true
        });
        
        emit DistributionCreated(id, token, total, snapshotBlock, deadline);
    }

    /**
     * @dev Claim rewards using EIP-712 signature
     */
    function claim(
        uint256 distributionId,
        bytes32 postId,
        address account,
        uint256 authorizedAmount,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant whenNotPaused {
        if (account == address(0)) revert InvalidAmount();
        if (deadline <= block.timestamp) revert DeadlineExpired();
        
        Distribution storage dist = dists[distributionId];
        if (!dist.active) revert DistributionInactive();
        if (deadline > dist.deadline) revert DeadlineExpired();
        
        // Verify EIP-712 signature
        bytes32 structHash = keccak256(abi.encode(
            keccak256("Claim(uint256 distributionId,bytes32 postId,address account,uint256 authorizedAmount,uint256 deadline)"),
            distributionId,
            postId,
            account,
            authorizedAmount,
            deadline
        ));
        
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            structHash
        ));
        
        address signer = digest.recover(signature);
        if (!hasRole(SIGNER_ROLE, signer)) revert UnauthorizedSigner();
        
        // Calculate claimable amount
        uint256 alreadyClaimed = claimed[distributionId][account];
        if (authorizedAmount <= alreadyClaimed) revert NoAmountToClaim();
        
        uint256 toClaim = authorizedAmount - alreadyClaimed;
        if (dist.remaining < toClaim) revert InsufficientRemaining();
        
        // Update state
        claimed[distributionId][account] = authorizedAmount;
        dist.remaining -= toClaim;
        
        // Transfer tokens from pool
        rewardPool.payTo(dist.token, account, toClaim);
        
        emit Claimed(distributionId, account, toClaim, authorizedAmount);
    }

    /**
     * @dev Sweep remaining tokens after deadline (admin only)
     */
    function sweepRemainder(uint256 id, address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Distribution storage dist = dists[id];
        if (!dist.active) revert DistributionInactive();
        if (block.timestamp <= dist.deadline) revert DeadlineExpired();
        if (to == address(0)) revert InvalidAmount();
        
        dist.active = false;
        
        // Optional: move unused cap back to pool (logical cap just resets)
        // For now, we keep the logical cap approach
    }

    /**
     * @dev Pause/unpause contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Get distribution info
     */
    function getDistribution(uint256 id) external view returns (Distribution memory) {
        return dists[id];
    }

    /**
     * @dev Get claimed amount for user
     */
    function getClaimed(uint256 id, address account) external view returns (uint256) {
        return claimed[id][account];
    }

    /**
     * @dev Pay tokens from pool (for testing purposes)
     */
    function payTo(address token, address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        rewardPool.payTo(token, to, amount);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
} 