# 프론트엔드 통합 가이드

## 개요
이 문서는 ELO Community 백엔드와 스마트 컨트랙트를 프론트엔드에서 사용하는 방법을 설명합니다.

## 스마트 컨트랙트 개요

### 1. TrivusEXP1363 (ERC-1363 토큰)
- **주소**: `0x5BF617D9d68868414611618336603B37f8061819` (Polygon Amoy)
- **기능**: 
  - `transferAndCall`: ERC-1363 표준으로 토큰 전송 + 콜백
  - `claimWithSignature`: EIP-712 서명 기반 토큰 클레임

### 2. PostLikeSystem1363 (좋아요 시스템)
- **주소**: `0xc5acB89285F9F0417A8172cd5530C5Ad15Cf41AA` (Polygon Amoy)
- **기능**:
  - `onTransferReceived`: ERC-1363 토큰 수신 시 자동 좋아요
  - `claimWithSignature`: EIP-712 서명 기반 게시글 보상 클레임

## 백엔드 API 엔드포인트 상세 가이드

### Base URL
```
https://your-backend-domain.com/api/v1
```

---

## 1. 좋아요 데이터 생성 (ERC-1363용)

### 엔드포인트
```
POST /post-like-signature/likes/data
```

### 요청 데이터
```json
{
  "postId": 123
}
```

### 요청 필드 설명
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `postId` | `number` | ✅ | 좋아요를 누를 게시글의 고유 ID |

### 응답 형식
```json
{
  "success": true,
  "data": {
    "postId": 123,
    "encodedData": "0x0000000000000000000000000000000000000000000000000000000000000007b"
  },
  "message": "Like data created successfully"
}
```

### 응답 필드 설명
| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | `boolean` | 요청 성공 여부 |
| `data.postId` | `number` | 요청한 게시글 ID |
| `data.encodedData` | `string` | ABI 인코딩된 postId (0x로 시작하는 hex 문자열) |
| `message` | `string` | 응답 메시지 |

### 사용법
이 `encodedData`를 `TrivusEXP1363.transferAndCall()`의 `data` 파라미터로 사용합니다.

---

## 2. 좋아요 서명 생성 (클레임용)

### 엔드포인트
```
POST /post-like-signature/create
```

### 요청 데이터
```json
{
  "postId": 123,
  "userAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
}
```

### 요청 필드 설명
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `postId` | `number` | ✅ | 보상을 받을 게시글의 고유 ID |
| `userAddress` | `string` | ✅ | 보상을 받을 사용자의 지갑 주소 (0x로 시작) |

**참고**: `amount` 필드는 더 이상 필요하지 않습니다. 백엔드에서 DB에 쌓여있는 사용자의 사용 가능한 토큰을 자동으로 조회하여 사용합니다.

### 응답 형식
```json
{
  "success": true,
  "data": {
    "postId": 123,
    "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "amount": "1.5",
    "deadline": 1692345678,
    "nonce": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "signature": "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba1b"
  },
  "message": "Like signature created successfully"
}
```

### 응답 필드 설명
| 필드 | 타입 | 설명 |
|------|------|------|
| `data.postId` | `number` | 게시글 ID |
| `data.to` | `string` | 보상 수신자 주소 |
| `data.amount` | `string` | 보상 양 (EXP 단위) |
| `data.deadline` | `number` | 서명 만료 시간 (Unix timestamp) |
| `data.nonce` | `string` | 고유 nonce (0x로 시작하는 64자 hex) |
| `data.signature` | `string` | EIP-712 서명 (0x로 시작하는 130자 hex) |

---

## 3. 토큰 클레임 서명 생성

### 엔드포인트
```
POST /post-like-signature/token-claim/create
```

### 요청 데이터
```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "reason": "hot_post_reward"
}
```

### 요청 필드 설명
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `address` | `string` | ✅ | 토큰을 받을 사용자의 지갑 주소 (0x로 시작) |
| `reason` | `string` | ❌ | 클레임 이유 (선택사항) |

**참고**: `amount` 필드는 더 이상 필요하지 않습니다. 백엔드에서 자동으로 사용자의 수확 가능한 토큰 양을 계산합니다.

### 응답 형식
```json
{
  "success": true,
  "data": {
    "to": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "amount": "10.5",
    "deadline": 1692345678,
    "nonce": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "signature": "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba1b"
  },
  "message": "Token claim signature created successfully"
}
```

### 응답 필드 설명
| 필드 | 타입 | 설명 |
|------|------|------|
| `data.to` | `string` | 토큰 수신자 주소 |
| `data.amount` | `string` | 토큰 양 (EXP 단위) |
| `data.deadline` | `number` | 서명 만료 시간 (Unix timestamp) |
| `data.nonce` | `string` | 고유 nonce (0x로 시작하는 64자 hex) |
| `data.signature` | `string` | EIP-712 서명 (0x로 시작하는 130자 hex) |

---

## 4. 사용자 토큰 정보 조회

### 엔드포인트
```
GET /post-like-signature/user/tokens?walletAddress=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
```

### 요청 파라미터
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `walletAddress` | `string` | ✅ | 사용자의 지갑 주소 (0x로 시작) |

### 응답 형식
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "totalTokens": 150.5,
    "availableTokens": 25.0,
    "pendingTokens": 10.5
  },
  "message": "User token info retrieved successfully"
}
```

### 응답 필드 설명
| 필드 | 타입 | 설명 |
|------|------|------|
| `data.walletAddress` | `string` | 사용자 지갑 주소 |
| `data.totalTokens` | `number` | 전체 보유 토큰 (수확 완료된 토큰) |
| `data.availableTokens` | `number` | 수확 가능한 토큰 (클레임 가능) |
| `data.pendingTokens` | `number` | 대기 중인 토큰 (accumulation에서 실시간 계산) |

---

## 5. 서비스 상태 확인

### 엔드포인트
```
POST /post-like-signature/status
```

### 요청 데이터
```json
{}
```

### 응답 형식
```json
{
  "success": true,
  "data": {
    "trivusExp": {
      "status": "healthy",
      "contractAddress": "0x5BF617D9d68868414611618336603B37f8061819"
    }
  },
  "message": "Service status retrieved successfully"
}
```

### 응답 필드 설명
| 필드 | 타입 | 설명 |
|------|------|------|
| `data.trivusExp.status` | `string` | 서비스 상태 ("healthy", "error" 등) |
| `data.trivusExp.contractAddress` | `string` | TrivusEXP 컨트랙트 주소 |

---

## 프론트엔드 통합 예시

### 1. 좋아요 기능 (ERC-1363)

```typescript
// 1. 좋아요 데이터 생성
const likeDataResponse = await fetch('/api/v1/post-like-signature/likes/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ postId: 123 })
});

if (!likeDataResponse.ok) {
  throw new Error('좋아요 데이터 생성 실패');
}

const { encodedData } = likeDataResponse.data;

// 2. 스마트 컨트랙트 호출 (transferAndCall)
const trivusExpContract = new ethers.Contract(TRIVUS_EXP_ADDRESS, TRIVUS_EXP_ABI, signer);
const likePrice = ethers.parseEther('1'); // 1 EXP

const tx = await trivusExpContract.transferAndCall(
  POST_LIKE_SYSTEM_ADDRESS, // PostLikeSystem 컨트랙트 주소
  likePrice,                 // 좋아요 가격
  encodedData               // postId가 인코딩된 데이터
);

await tx.wait();
console.log('좋아요 완료!');
```

### 2. 게시글 보상 클레임

```typescript
// 1. 클레임 서명 생성
const claimResponse = await fetch('/api/v1/post-like-signature/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    postId: 123,
    userAddress: userAddress
  })
});

if (!claimResponse.ok) {
  throw new Error('클레임 서명 생성 실패');
}

const { postId, to, amount, deadline, nonce, signature } = claimResponse.data;
// amount는 백엔드에서 자동으로 계산된 수확 가능한 토큰 양

// 2. 스마트 컨트랙트 호출 (claimWithSignature)
const postLikeSystemContract = new ethers.Contract(
  POST_LIKE_SYSTEM_ADDRESS, 
  POST_LIKE_SYSTEM_ABI, 
  signer
);

const tx = await postLikeSystemContract.claimWithSignature(
  postId,
  to,
  ethers.parseEther(amount),
  deadline,
  nonce,
  signature
);

await tx.wait();
console.log('보상 클레임 완료!');
```