# 🎁 ELO Community Reward System

This document describes the integrated reward system for the ELO Community backend, implementing **EIP-712 signed claim tickets** with a **pre-funded pool** model.

## 🏗️ Architecture Overview

The system consists of two main smart contracts and a NestJS backend integration:

- **RewardPool**: Pre-funded vault that holds ERC-20 tokens
- **SignedRewardDistributor**: Handles EIP-712 signed claims and distributions
- **NestJS Integration**: Admin APIs, ticket generation, and SSE for real-time updates

## 📋 Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database
- Polygon Amoy testnet access
- Very network access (for production)

## 🚀 Quick Start

### 1. Environment Setup

Copy `env.example` to `.env` and configure:

```bash
# Blockchain Configuration
CHAIN_AMOY_ID=80002
RPC_AMOY=https://rpc-amoy.polygon.technology
ADMIN_PRIV_KEY=0x...  # Your admin private key
SIGNER_PRIV_KEY=0x... # Your signer private key (different from admin)

# Contract addresses (fill after deployment)
REWARD_POOL_AMOY=0x...
DISTRIBUTOR_AMOY=0x...
TOKEN_AMOY=0x...
```

### 2. Install Dependencies

```bash
# Install root dependencies
pnpm install

# Install contract dependencies
cd contracts
pnpm install
```

### 3. Deploy Contracts

```bash
# Deploy to Amoy testnet
cd contracts
pnpm run deploy:amoy

# Update .env with deployed addresses
REWARD_POOL_AMOY=0x...
DISTRIBUTOR_AMOY=0x...
```

### 4. Start Backend

```bash
# Start NestJS backend
pnpm run api:dev
```

## 🔧 Smart Contracts

### RewardPool

- **Purpose**: Pre-funded vault for reward tokens
- **Features**: 
  - Admin deposits tokens
  - Only distributor can pay out
  - UUPS upgradeable
- **Key Functions**:
  - `deposit(token, amount)` - Admin deposits tokens
  - `payTo(token, to, amount)` - Distributor pays rewards
  - `setDistributor(address)` - Admin sets distributor

### SignedRewardDistributor

- **Purpose**: Handles EIP-712 signed reward claims
- **Features**:
  - UUPS upgradeable with role-based access
  - EIP-712 signature verification
  - Cumulative claim model
  - Deadline enforcement
- **Key Functions**:
  - `createDistribution(id, token, total, snapshotBlock, deadline)` - Admin creates distribution
  - `claim(distributionId, postId, account, authorizedAmount, deadline, signature)` - User claims rewards
  - `sweepRemainder(id, to)` - Admin sweeps unused funds

## 🌐 API Endpoints

### Admin Endpoints

#### Create Distribution
```http
POST /rewards/admin/distributions
Content-Type: application/json

{
  "id": 1,
  "token": "0x...",
  "total": "1000000000000000000000",
  "snapshotBlock": 12345678,
  "deadline": 1704067200,
  "chain": "amoy"
}
```

### User Endpoints

#### Get Claim Ticket
```http
GET /rewards/1/ticket?account=0x...&postId=0x...&chain=amoy
```

Returns EIP-712 signed claim ticket:
```json
{
  "domain": {
    "name": "SignedRewardDistributor",
    "version": "1",
    "chainId": 80002,
    "verifyingContract": "0x..."
  },
  "types": {
    "Claim": [...]
  },
  "message": {
    "distributionId": 1,
    "postId": "0x...",
    "account": "0x...",
    "authorizedAmount": "100000000000000000000",
    "deadline": 1704067200
  },
  "signature": "0x..."
}
```

#### Get Distribution Info
```http
GET /rewards/1?chain=amoy
```

### SSE Endpoints

#### General Stream
```http
GET /sse/stream?account=0x...&chain=amoy
```

#### Distribution Events
```http
GET /sse/distributions
```

#### Claim Events
```http
GET /sse/claims?account=0x...
```

## 🔐 Security Features

### Key Separation
- **ADMIN**: Creates distributions, manages pool
- **SIGNER**: Signs EIP-712 claim tickets (off-chain only)

### EIP-712 Protection
- Domain includes `chainId` and `verifyingContract`
- Message includes `account` and `deadline`
- Prevents cross-chain replay and front-running

### On-chain Validation
- Cumulative claim model prevents double-spending
- Deadline enforcement
- Remaining cap enforcement
- Role-based access control

## 📱 Client Integration

### 1. Get Claim Ticket
```typescript
const response = await fetch('/rewards/1/ticket?account=0x...&postId=0x...&chain=amoy');
const ticket = await response.json();
```

### 2. Submit Claim
```typescript
import { ethers } from 'ethers';

const distributor = new ethers.Contract(distributorAddress, abi, signer);
const tx = await distributor.claim(
  ticket.message.distributionId,
  ticket.message.postId,
  ticket.message.account,
  ticket.message.authorizedAmount,
  ticket.message.deadline,
  ticket.signature
);
```

### 3. Listen to Events
```typescript
const eventSource = new EventSource('/sse/stream?account=0x...&chain=amoy');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data);
};
```

## 🧪 Testing

### Contract Tests
```bash
cd contracts
pnpm test
```

### Backend Tests
```bash
pnpm test:api
```

### Manual Testing
```bash
# Sign a test ticket
cd contracts
pnpm run sign:ticket -- 1 0x1234... 0xabcd... 1000000000000000000 1704067200 80002

# Create test distribution
pnpm run create:dist --id 1 --token 0x... --total 1000e18 --deadline 1704067200 --snapshot 12345678 --chain amoy
```

## 🚨 Important Notes

1. **Never share private keys** - ADMIN and SIGNER keys must be kept secure
2. **Different keys** - ADMIN and SIGNER should be different addresses
3. **Environment validation** - All blockchain config must be set before startup
4. **Gas estimation** - Test claim transactions on testnet first
5. **Snapshot logic** - Implement your off-chain eligibility calculation in `calculateAuthorizedAmount()`

## 🔄 Deployment Workflow

### Testnet (Amoy)
1. Deploy contracts: `pnpm run deploy:amoy`
2. Update `.env` with addresses
3. Test distribution creation and claims
4. Verify SSE events

### Production (Very)
1. Update `.env` with Very network config
2. Deploy contracts: `pnpm run deploy:very`
3. Update addresses in `.env`
4. Test full workflow
5. Monitor events and claims

## 🆘 Troubleshooting

### Common Issues

1. **"Provider not found"** - Check RPC URLs in `.env`
2. **"Invalid chain parameter"** - Use 'amoy' or 'very' only
3. **"Contract not found"** - Verify contract addresses in `.env`
4. **"Insufficient balance"** - Deposit tokens to pool first
5. **"Unauthorized signer"** - Check SIGNER_PRIV_KEY configuration

### Debug Commands
```bash
# Check contract state
pnpm run contracts:compile

# Verify deployment
pnpm run contracts:deploy:amoy

# Check logs
pnpm run api:dev
```

## 📚 Additional Resources

- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [NestJS Documentation](https://docs.nestjs.com/) 