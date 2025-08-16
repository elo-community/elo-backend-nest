# ERC-1363 기반 좋아요 시스템

## 🎯 개요

이 프로젝트는 **ERC-1363 표준**을 사용하여 **단일 트랜잭션으로 좋아요를 처리**하는 시스템입니다.

### 주요 특징
- ✅ **서명 한 번**: 사용자가 approve + transfer 대신 transferAndCall 한 번만 실행
- ✅ **가스 효율성**: 여러 트랜잭션을 하나로 통합
- ✅ **보안성**: ERC-1363 표준 준수
- ✅ **확장성**: 다른 ERC-1363 기능 추가 가능

## 🏗️ 아키텍처

```
User → TrivusEXP1363.transferAndCall() → PostLikeReceiver.onTransferReceived()
```

1. **사용자**가 `token.transferAndCall(receiver, 1e18, data)` 호출
2. **토큰 전송**과 **콜백 호출**이 **원자적으로** 실행
3. **PostLikeReceiver**가 `onTransferReceived` 콜백에서 좋아요 처리

## 📁 컨트랙트 구조

### 1. TrivusEXP1363 (ERC-1363 토큰)
- **위치**: `contracts/token/TrivusEXP1363.sol`
- **기능**: ERC-20 + ERC-1363 `transferAndCall` 지원
- **특징**: 18 소수점, 1 EXP = 1e18 wei

### 2. PostLikeReceiver (좋아요 처리)
- **위치**: `contracts/like/PostLikeReceiver.sol`
- **기능**: ERC-1363 콜백을 통한 좋아요 처리
- **모드**: Escrow 모드 (토큰 임시 보관 후 인출)

## 🚀 배포 방법

### 1. 환경 설정
```bash
# .env 파일 생성
TRIVUS_EXP_1363_ADDRESS=0x...  # (1단계 배포 후 설정)
```

### 2. 토큰 배포
```bash
npx hardhat run scripts/deploy_trivus1363.ts
```

### 3. 좋아요 시스템 배포
```bash
npx hardhat run scripts/deploy_like_receiver.ts
```

## 💻 사용법

### 프론트엔드 (React + ethers v6)

```typescript
import { likePostWith1363, getPostInfo } from './lib/like';

// 좋아요 보내기
const result = await likePostWith1363(
    "0x...", // 토큰 주소
    "0x...", // PostLikeReceiver 주소
    1n,      // 게시글 ID
    signer
);

// 게시글 정보 조회
const info = await getPostInfo(
    "0x...", // PostLikeReceiver 주소
    1n,      // 게시글 ID
    provider
);
```

### 백엔드 (NestJS)

```typescript
// 게시글 등록 (Owner만)
await likeReceiver.registerPost(postId, authorAddress);

// 게시글 정보 조회
const [author, likes, tokens] = await likeReceiver.getPostInfo(postId);
```

## 🧪 테스트

### 전체 테스트 실행
```bash
npx hardhat test test/like1363.spec.ts
```

### 개별 테스트 실행
```bash
# 기본 동작 테스트
npx hardhat run scripts/test_simple_1363.ts

# 에러 케이스 테스트
npx hardhat run scripts/debug_errors.ts
```

## 🔒 보안 기능

- **중복 좋아요 방지**: 같은 사용자가 같은 게시글에 중복 좋아요 불가
- **자기 자신 좋아요 방지**: 게시글 작성자는 자신의 게시글에 좋아요 불가
- **권한 관리**: 게시글 등록은 Owner만 가능
- **토큰 검증**: 정확히 1 EXP만 허용

## 📊 이벤트

### PostLiked
```solidity
event PostLiked(address indexed user, uint256 indexed postId, uint256 amount);
```

### TokensWithdrawn
```solidity
event TokensWithdrawn(address indexed author, uint256 indexed postId, uint256 amount);
```

## 🔄 워크플로우

### 1. 게시글 등록
```
Owner → registerPost(postId, author) → PostRegistered 이벤트
```

### 2. 좋아요 처리
```
User → transferAndCall(receiver, 1e18, postId) → PostLiked 이벤트
```

### 3. 토큰 인출
```
Author → withdraw(postId) → TokensWithdrawn 이벤트
```

## 🚨 주의사항

1. **게시글 등록**: 사용하기 전에 반드시 `registerPost`로 게시글을 등록해야 함
2. **토큰 잔액**: 사용자는 좋아요를 보내기 전에 충분한 토큰을 보유해야 함
3. **권한**: 게시글 등록과 토큰 인출은 적절한 권한이 필요함

## 🔧 문제 해결

### "1363: non receiver" 에러
- **원인**: PostLikeReceiver가 IERC1363Receiver 인터페이스를 제대로 구현하지 못함
- **해결**: 에러 메시지 전파를 위해 TrivusEXP1363의 `_callOnTransferReceived` 수정

### 테스트 실패
- **원인**: OpenZeppelin 최신 버전에서 에러 메시지 변경
- **해결**: `revertedWithCustomError` 사용

## 📈 성능

- **가스 비용**: `transferAndCall` ≈ 77,398 - 128,698 gas
- **배포 비용**: PostLikeReceiver ≈ 752,708 gas, TrivusEXP1363 ≈ 816,090 gas
- **최적화**: Solidity optimizer 200 runs 활성화

## 🌟 향후 개선 사항

1. **Instant-settle 모드**: 즉시 토큰 전송 (현재는 Escrow 모드)
2. **Unlike 기능**: 좋아요 취소 시 토큰 반환
3. **배치 처리**: 여러 게시글 동시 좋아요
4. **메타데이터**: 좋아요 시 추가 정보 전송

---

**ERC-1363 기반 좋아요 시스템이 성공적으로 구현되었습니다!** 🎉
