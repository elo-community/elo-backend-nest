# 🔧 환경변수 설정 가이드

## 📋 필수 환경변수

### 1. **Database Configuration**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=elo_community
```

### 2. **JWT Configuration**
```bash
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
```

### 3. **AWS Configuration**
```bash
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=your_s3_bucket_name
```

### 4. **Blockchain Configuration**

#### **RPC URLs**
```bash
RPC_AMOY=https://rpc-amoy.polygon.technology
CHAIN_AMOY_ID=80002
RPC_VERY=https://rpc-very.polygon.technology
CHAIN_VERY_ID=80002
```

#### **Admin Wallet Private Keys**
```bash
ADMIN_PRIV_KEY=your_admin_private_key
SIGNER_PRIV_KEY=your_signer_private_key
TRUSTED_SIGNER_PRIV_KEY=your_trusted_signer_private_key
```

#### **Smart Contract Addresses**
```bash
# TrivusEXP 토큰 컨트랙트 (ERC-20)
TRIVUS_EXP_AMOY=0x... # 배포된 TrivusEXP 컨트랙트 주소
TRIVUS_EXP_VERY=0x... # Very 네트워크용

# PostLikeSystem 컨트랙트 (좋아요 시스템)
POST_LIKE_SYSTEM_AMOY=0x... # 배포된 PostLikeSystem 컨트랙트 주소
POST_LIKE_SYSTEM_VERY=0x... # Very 네트워크용

# 기타 컨트랙트들
DISTRIBUTOR_AMOY=0x...
REWARD_POOL_AMOY=0x...
DISTRIBUTOR_VERY=0x...
REWARD_POOL_VERY=0x...
```

### 5. **App Configuration**
```bash
PORT=3000
NODE_ENV=development
CORS_ORIGINS=https://www.trivus.net,https://trivus.net,http://localhost:3009
```

## 🚀 배포 순서

### 1. **TrivusEXP 토큰 컨트랙트 배포**
```bash
cd packages/contracts
npx hardhat run scripts/deployTrivusEXP.ts --network amoy
```

### 2. **PostLikeSystem 컨트랙트 배포**
```bash
# deployPostLikeSystem.ts에서 TRIVUS_TOKEN_ADDRESS 업데이트
npx hardhat run scripts/deployPostLikeSystem.ts --network amoy
```

### 3. **환경변수 설정**
```bash
# .env 파일에 컨트랙트 주소 추가
TRIVUS_EXP_AMOY=0x... # 1단계에서 배포된 주소
POST_LIKE_SYSTEM_AMOY=0x... # 2단계에서 배포된 주소
```

### 4. **백엔드 서버 시작**
```bash
cd packages/backend
npm run start:dev
```

## ⚠️ 주의사항

1. **Private Key 보안**: 절대 `.env` 파일을 Git에 커밋하지 마세요
2. **네트워크 확인**: 올바른 네트워크(Amoy/Very)에 연결되어 있는지 확인
3. **컨트랙트 주소**: 배포 후 정확한 주소를 환경변수에 설정
4. **토큰 승인**: 사용자가 좋아요를 누르기 전에 `approve()` 함수 호출 필요

## 🔍 문제 해결

### **컨트랙트 배포 실패**
- 네트워크 연결 상태 확인
- 가스비 충분한지 확인
- Private Key 유효성 확인

### **이벤트 리스너 동작 안함**
- 컨트랙트 주소 정확성 확인
- RPC URL 연결 상태 확인
- 백엔드 로그에서 에러 메시지 확인

### **토큰 전송 실패**
- 사용자 토큰 잔액 확인
- `approve()` 함수 호출 여부 확인
- 네트워크 가스비 확인
