// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title RewardPool
 * @dev Pre-funded vault that holds ERC-20 tokens for reward distributions
 * Only the authorized Distributor can withdraw tokens to pay rewards
 */
contract RewardPool is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    mapping(address => uint256) public tokenBalances;
    address public distributor;

    event Deposited(address indexed token, uint256 amount);
    event Paid(address indexed token, address indexed to, uint256 amount);
    event DistributorSet(address indexed oldDistributor, address indexed newDistributor);

    error Unauthorized();
    error InsufficientBalance();
    error DistributorNotSet();
    error InvalidAmount();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @dev Deposit tokens into the pool (admin only)
     * @param token ERC-20 token address
     * @param amount Amount to deposit
     */
    function deposit(address token, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (amount == 0) revert InvalidAmount();
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        tokenBalances[token] += amount;
        
        emit Deposited(token, amount);
    }

    /**
     * @dev Pay tokens to a recipient (distributor only)
     * @param token ERC-20 token address
     * @param to Recipient address
     * @param amount Amount to pay
     */
    function payTo(address token, address to, uint256 amount) external onlyRole(DISTRIBUTOR_ROLE) {
        if (amount == 0) revert InvalidAmount();
        if (to == address(0)) revert InvalidAmount();
        if (tokenBalances[token] < amount) revert InsufficientBalance();
        
        tokenBalances[token] -= amount;
        IERC20(token).safeTransfer(to, amount);
        
        emit Paid(token, to, amount);
    }

    /**
     * @dev Set the distributor address (admin only)
     * @param newDistributor New distributor address
     */
    function setDistributor(address newDistributor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newDistributor == address(0)) revert InvalidAmount();
        
        address oldDistributor = distributor;
        distributor = newDistributor;
        
        if (oldDistributor != address(0)) {
            _revokeRole(DISTRIBUTOR_ROLE, oldDistributor);
        }
        
        _grantRole(DISTRIBUTOR_ROLE, newDistributor);
        
        emit DistributorSet(oldDistributor, newDistributor);
    }

    /**
     * @dev Get token balance in the pool
     * @param token ERC-20 token address
     * @return Current balance
     */
    function balance(address token) external view returns (uint256) {
        return tokenBalances[token];
    }

    /**
     * @dev Internal function to debit tokens (for future use)
     * @param token ERC-20 token address
     * @param amount Amount to debit
     */
    function _debit(address token, uint256 amount) internal {
        if (tokenBalances[token] < amount) revert InsufficientBalance();
        tokenBalances[token] -= amount;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
} 