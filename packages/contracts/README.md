# 🏗️ ELO Community Smart Contracts

This package contains the smart contracts for the ELO Community reward system.

## 📁 Structure

```
contracts/
├── contracts/           # Solidity contracts
│   ├── RewardPool.sol              # Pre-funded vault
│   └── SignedRewardDistributor.sol # EIP-712 claim handler
├── scripts/             # Deployment scripts
│   ├── deploy.ts                   # Full deployment
│   ├── deployPool.ts               # Pool only
│   └── signTicket.ts               # Ticket signing
├── test/                # Test files
└── hardhat.config.ts    # Hardhat configuration
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Compile Contracts

```bash
pnpm run compile
```

### 3. Run Tests

```bash
pnpm test
```

### 4. Deploy to Testnet

```bash
# Deploy to Amoy testnet
pnpm run deploy:amoy

# Deploy to Very network
pnpm run deploy:very
```

## 🔧 Available Scripts

- `pnpm run compile` - Compile contracts
- `pnpm run test` - Run tests
- `pnpm run deploy:amoy` - Deploy to Amoy testnet
- `pnpm run deploy:very` - Deploy to Very network
- `pnpm run deploy:pool` - Deploy only RewardPool
- `pnpm run sign:ticket` - Sign EIP-712 claim ticket

## 📋 Environment Variables

Required environment variables:

```bash
# Networks
RPC_AMOY=https://rpc-amoy.polygon.technology
RPC_VERY=https://your-very-rpc-url
CHAIN_VERY_ID=<very_chain_id>

# Keys
ADMIN_PRIV_KEY=0x...
SIGNER_PRIV_KEY=0x...

# Optional
POLYGONSCAN_API_KEY=...
```

## 🎯 Contract Overview

### RewardPool

Pre-funded vault that holds ERC-20 tokens for distributions.

**Key Functions:**
- `deposit(token, amount)` - Admin deposits tokens
- `payTo(token, to, amount)` - Distributor pays rewards
- `setDistributor(address)` - Admin sets distributor

### SignedRewardDistributor

Handles EIP-712 signed reward claims with role-based access control.

**Key Functions:**
- `createDistribution(id, token, total, snapshotBlock, deadline)` - Admin creates distribution
- `claim(distributionId, postId, account, authorizedAmount, deadline, signature)` - User claims rewards
- `sweepRemainder(id, to)` - Admin sweeps unused funds

## 🔐 Security Features

- **UUPS Upgradeable** - Admin can upgrade contracts
- **Role-Based Access** - Separate roles for admin, pauser, and signer
- **EIP-712 Signatures** - Secure claim verification
- **Reentrancy Protection** - Prevents reentrancy attacks
- **Pausable** - Admin can pause operations

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test test/RewardPool.test.ts

# Run with coverage
pnpm test --coverage
```

## 📦 Deployment

### Local Development

```bash
# Start local node
npx hardhat node

# Deploy to local network
pnpm run deploy:local
```

### Testnet (Amoy)

```bash
# Deploy to Amoy
pnpm run deploy:amoy

# Verify contracts
pnpm run verify
```

### Production (Very)

```bash
# Deploy to Very
pnpm run deploy:very

# Verify contracts
pnpm run verify
```

## 🔍 Verification

After deployment, verify contracts on block explorers:

```bash
# Verify on Etherscan
npx hardhat verify --network amoy <CONTRACT_ADDRESS> [CONSTRUCTOR_ARGS]
```

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [Solidity Documentation](https://docs.soliditylang.org/) 