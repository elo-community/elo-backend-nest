# 환경변수 설정 가이드

## 개요
이 프로젝트는 네트워크별, 환경별로 환경변수를 분리하여 관리합니다.

## 환경변수 파일 구조

### 1. 네트워크별 분리
- **Polygon Amoy**: Polygon의 테스트넷
- **Very**: Very 테스트넷

### 2. 환경별 분리
- **Local**: 로컬 개발 환경
- **Deploy**: 배포/운영 환경

### 3. 파일 우선순위
환경변수는 다음 순서로 로드됩니다:

1. `.env.{network}.{environment}` (최우선)
   - `.env.amoy.local`
   - `.env.amoy.deploy`
   - `.env.very.local`
   - `.env.very.deploy`

2. `.env.{network}` (2순위)
   - `.env.amoy`
   - `.env.very`

3. `.env.{environment}` (3순위)
   - `.env.local`
   - `.env.deploy`

4. `.env` (기본값)

## 사용 방법

### 1. 환경변수 파일 복사
```bash
# Polygon Amoy 로컬 개발용
cp env.amoy.local .env.amoy.local

# Polygon Amoy 배포용
cp env.amoy.deploy .env.amoy.deploy

# Very 로컬 개발용
cp env.very.local .env.very.local

# Very 배포용
cp env.very.deploy .env.very.deploy
```

### 2. 환경변수 설정
각 파일에서 실제 값으로 변경:

```bash
# .env.amoy.local 예시
ACTIVE_NETWORK=amoy
NODE_ENV=local
DB_PASSWORD=your_actual_password
ADMIN_PRIV_KEY=your_actual_private_key
TRIVUS_EXP_1363_AMOY=0x5BF617D9d68868414611618336603B37f8061819
```

### 3. 서버 시작
```bash
# 기본값으로 시작 (amoy + local)
npm run start

# 환경변수로 네트워크/환경 지정
ACTIVE_NETWORK=very NODE_ENV=deploy npm run start
```

## 환경변수 목록

### 공통 설정
- `ACTIVE_NETWORK`: 활성 네트워크 (amoy/very)
- `NODE_ENV`: 환경 (local/deploy)

### 데이터베이스
- `DB_HOST`: 데이터베이스 호스트
- `DB_PORT`: 데이터베이스 포트
- `DB_USERNAME`: 데이터베이스 사용자명
- `DB_PASSWORD`: 데이터베이스 비밀번호
- `DB_DATABASE`: 데이터베이스명

### JWT
- `JWT_SECRET`: JWT 시크릿 키
- `JWT_EXPIRES_IN`: JWT 만료 시간

### AWS
- `AWS_REGION`: AWS 리전
- `AWS_ACCESS_KEY_ID`: AWS 액세스 키
- `AWS_SECRET_ACCESS_KEY`: AWS 시크릿 키
- `AWS_S3_BUCKET_NAME`: S3 버킷명

### 블록체인 네트워크
#### Polygon Amoy
- `RPC_AMOY`: RPC URL
- `CHAIN_AMOY_ID`: 체인 ID (80002)

#### Very
- `RPC_VERY`: RPC URL
- `CHAIN_VERY_ID`: 체인 ID (80002)

### 계정 설정
- `ADMIN_PRIV_KEY`: 관리자 개인키
- `ADMIN_ADDRESS`: 관리자 주소
- `SIGNER_PRIV_KEY`: 서명자 개인키
- `SIGNER_ADDRESS`: 서명자 주소
- `TRUSTED_SIGNER_PRIV_KEY`: 신뢰할 수 있는 서명자 개인키
- `TRUSTED_SIGNER_ADDRESS`: 신뢰할 수 있는 서명자 주소

### 컨트랙트 주소
#### Polygon Amoy
- `TRIVUS_EXP_1363_AMOY`: TrivusEXP 토큰 컨트랙트
- `POST_LIKE_SYSTEM_AMOY`: PostLikeSystem 컨트랙트
- `DISTRIBUTOR_AMOY`: 분배자 컨트랙트
- `REWARD_POOL_AMOY`: 리워드 풀 컨트랙트

#### Very
- `TRIVUS_EXP_VERY`: TrivusEXP 토큰 컨트랙트
- `POST_LIKE_SYSTEM_VERY`: PostLikeSystem 컨트랙트
- `DISTRIBUTOR_VERY`: 분배자 컨트랙트
- `REWARD_POOL_VERY`: 리워드 풀 컨트랙트

### 네트워크 설정
- `BLOCKCHAIN_POLLING_INTERVAL`: 폴링 간격 (밀리초)
- `BLOCKCHAIN_BLOCK_RANGE`: 블록 확인 범위
- `GAS_PRICE_{NETWORK}`: 가스 가격
- `GAS_LIMIT_{NETWORK}`: 가스 한도

### 앱 설정
- `PORT`: 서버 포트
- `CORS_ORIGINS`: CORS 허용 도메인

## 네트워크 전환

### 런타임에 네트워크 변경
```typescript
import { NetworkLoader } from './config/network-loader';

const loader = NetworkLoader.getInstance();

// 네트워크 변경
loader.switchNetwork('very');

// 환경 변경
loader.switchEnvironment('deploy');
```

### 환경변수로 네트워크 변경
```bash
# Very 네트워크로 변경
export ACTIVE_NETWORK=very

# 배포 환경으로 변경
export NODE_ENV=deploy
```

## 주의사항

1. **보안**: 실제 개인키와 시크릿은 절대 Git에 커밋하지 마세요
2. **환경별 설정**: 로컬과 배포 환경의 설정값을 구분하여 관리하세요
3. **네트워크별 설정**: 각 네트워크의 RPC URL과 컨트랙트 주소를 정확히 설정하세요
4. **폴백**: 환경변수 파일이 없을 경우 기본 `.env` 파일을 사용합니다

## 문제 해결

### 환경변수가 로드되지 않는 경우
1. 파일 경로 확인: `packages/backend/` 디렉토리에 있는지 확인
2. 파일명 확인: `.env.{network}.{environment}` 형식인지 확인
3. 권한 확인: 파일 읽기 권한이 있는지 확인

### 네트워크 전환이 안 되는 경우
1. `ACTIVE_NETWORK` 환경변수 확인
2. `NODE_ENV` 환경변수 확인
3. 서버 재시작 필요할 수 있음
