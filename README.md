# Trivus Backend
<img src="https://github.com/elo-community/elo-backend-nest/blob/main/docs/trivus_logo.png" width="100" height="200"/>


## 개요
Trivus는 스포츠 커뮤니티 플랫폼으로, 사용자들이 스포츠 관련 게시글을 작성하고, 매치 결과를 공유하며, 블록체인 기반의 토큰 시스템을 통해 보상을 받을 수 있는 서비스입니다.

<br><br>


## 주요 기능

### 🏆 ELO 시스템
- 사용자의 스포츠 실력을 ELO 점수로 평가
- 매치 결과에 따른 실시간 ELO 점수 업데이트
- 스포츠 카테고리별 독립적인 ELO 관리

### 💰 토큰 시스템
- **TrivusEXP**: ERC-1363 표준 기반의 플랫폼 토큰
- **좋아요 보상**: 게시글 좋아요 시 토큰 지급
- **핫 포스트 보상**: 인기 게시글 작성자에게 추가 보상
- **튜토리얼 보상**: 신규 사용자 첫 액션 완료 시 보상

### 📝 커뮤니티 기능
- 게시글 작성 및 관리
- 댓글 및 답글 시스템
- 좋아요/싫어요 기능
- 매치 결과 등록 및 공유

### 🔐 인증 시스템
- JWT 기반 사용자 인증
- 지갑 주소 기반 사용자 식별
- EIP-712 서명 기반 보안

<br><br>


## 백엔드 아키텍처
![](https://github.com/elo-community/elo-backend-nest/blob/main/docs/trivus-backend-system-design.drawio.png?raw=true)

### Backend
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT + Passport
- **Blockchain**: Ethers.js 6.x
- **File Storage**: AWS S3
- **Scheduling**: NestJS Schedule

### Smart Contracts
- **Token**: TrivusEXP1363 (ERC-1363)
- **Like System**: PostLikeSystem1363
- **Networks**: Polygon Amoy, Very Testnet

### Infrastructure
- **Container**: Docker + Docker Compose
- **Web Server**: Nginx
- **Environment**: Multi-network, Multi-environment support

## 프로젝트 구조

```
elo-community-backend-nest/
├── packages/
│   ├── backend/                 # NestJS 백엔드 애플리케이션
│   │   ├── src/
│   │   │   ├── auth/           # 인증 관련 모듈
│   │   │   ├── blockchain/     # 블록체인 연동 모듈
│   │   │   ├── controllers/    # API 컨트롤러
│   │   │   ├── dtos/          # 데이터 전송 객체
│   │   │   ├── entities/      # 데이터베이스 엔티티
│   │   │   ├── elo/           # ELO 시스템 모듈
│   │   │   ├── rewards/       # 보상 시스템 모듈
│   │   │   ├── schedulers/    # 스케줄러
│   │   │   ├── services/      # 비즈니스 로직 서비스
│   │   │   └── shared/        # 공통 유틸리티
│   │   └── scripts/           # 유틸리티 스크립트
│   └── contracts/             # 스마트 컨트랙트
│       ├── contracts/         # Solidity 컨트랙트
│       ├── scripts/           # 배포 스크립트
│       └── test/              # 컨트랙트 테스트
├── infra/                     # 인프라 설정
│   ├── docker-compose.yml     # Docker Compose 설정
│   ├── nginx/                 # Nginx 설정
│   └── env/                   # 환경변수 템플릿
└── nginx/                     # 로컬 Nginx 설정
```

### 주요 API 엔드포인트
- **인증**: `/api/v1/auth/*` - 로그인, 사용자 인증
- **사용자**: `/api/v1/users/*` - 사용자 관리, 프로필
- **게시글**: `/api/v1/posts/*` - 게시글 CRUD
- **댓글**: `/api/v1/comments/*` - 댓글 및 답글
- **ELO**: `/api/v1/elo/*` - ELO 점수 시스템
- **블록체인**: `/api/v1/blockchain/*` - 블록체인 연동
- **보상**: `/api/v1/rewards/*` - 토큰 보상 시스템

### API Documentation
👉 [Trivus API Docs](https://github.com/elo-community/elo-backend-nest/blob/main/docs/api_docs.md)



<br><br>

## 빠른 시작

### 1. 환경 설정

아래 example을 참고하여 네트워크 환경에 따라 반영

- [env.example.very](https://github.com/elo-community/elo-backend-nest/blob/main/docs/env.example.very)
- [env.example.amoy](https://github.com/elo-community/elo-backend-nest/blob/main/docs/env.example.amoy)



#### 자동 환경변수 설정 (권장)
```bash
cd packages/backend

# 모든 환경 설정 (amoy local, amoy production, very local, very production)
npm run setup:env:all

# 또는 특정 환경만 설정
npm run setup:env:amoy:local      # Polygon Amoy 로컬 개발용
npm run setup:env:amoy:production # Polygon Amoy 배포용
npm run setup:env:very:local      # Very 로컬 개발용
npm run setup:env:very:production # Very 배포용
```

#### 수동 환경변수 설정
```bash
# 루트 디렉토리에서 템플릿 파일을 복사하여 환경변수 파일 생성
cp docs/env.example.amoy .env.amoy.local
cp docs/env.example.very .env.very.local

# 또는 특정 환경 파일 생성
cp docs/env.example.amoy .env.amoy.production
cp docs/env.example.very .env.very.production
```

#### 환경변수 값 설정
생성된 파일에서 실제 값으로 변경:
```bash
# .env.amoy.local 예시
NETWORK=amoy
NODE_ENV=local
DB_PASSWORD=your_actual_password
ADMIN_PRIV_KEY=your_actual_private_key
TRIVUS_EXP_1363_AMOY=0x01234...
```

**참고**: 환경변수는 다음 우선순위로 자동 로드됩니다:
1. `.env.{network}.{environment}` (예: `.env.amoy.local`)
2. `.env.{network}` (예: `.env.amoy`)
3. `.env.{environment}` (예: `.env.local`)
4. `.env` (기본값)

**주요 환경변수**:
- `NETWORK`: 활성 네트워크 (amoy/very)
- `NODE_ENV`: 환경 (local/production)

### 2. 의존성 설치
```bash
# 루트 디렉토리
npm install

# 백엔드 패키지
cd packages/backend
npm install

# 컨트랙트 패키지
cd ../contracts
npm install
```

### 3. 데이터베이스 설정
```bash
# PostgreSQL 데이터베이스 생성
createdb elo_community

# 또는 Docker Compose 사용
cd infra
docker-compose up -d postgres
```

### 4. 애플리케이션 실행
```bash
# 백엔드 개발 모드
cd packages/backend
npm run start:dev

# 또는 환경변수로 네트워크/환경 지정
NETWORK=amoy NODE_ENV=local npm run start:dev
```

### 5. Docker로 전체 스택 실행
```bash
cd infra
docker-compose up -d
```

## API 문서

### Base URL
```
http://localhost:3000/api/v1
```

### 주요 엔드포인트

#### 인증
- `POST /auth/login` - 지갑 주소로 로그인
- `POST /auth/verify` - JWT 토큰 검증

#### 사용자
- `GET /users/profile` - 사용자 프로필 조회
- `PUT /users/profile` - 사용자 프로필 업데이트
- `GET /users/elo` - 사용자 ELO 점수 조회

#### 게시글
- `GET /posts` - 게시글 목록 조회
- `POST /posts` - 게시글 작성
- `GET /posts/:id` - 게시글 상세 조회
- `PUT /posts/:id` - 게시글 수정
- `DELETE /posts/:id` - 게시글 삭제

#### 좋아요 시스템
- `POST /post-like-signature/likes/data` - 좋아요 데이터 생성
- `POST /post-like-signature/create` - 좋아요 서명 생성
- `POST /post-likes` - 좋아요 등록

#### 매치 결과
- `POST /match-results` - 매치 결과 등록
- `GET /match-results` - 매치 결과 목록 조회
- `GET /match-results/history` - 매치 결과 히스토리

#### 토큰
- `GET /post-like-signature/user/tokens` - 사용자 토큰 정보
- `POST /token-transactions/claim-all-accumulated` - 토큰 클레임 서명 생성
- `POST /post-like-signature/likes/data` - 좋아요 call에 사용할 데이터 생성
- `POST /post-like-signature/create` - 좋아요 클레임 서명 생성



## 블록체인 연동

### 스마트 컨트랙트

#### TrivusEXP1363 (ERC-1363 토큰)
- **주소**: `0x5BF617D9d68868414611618336603B37f8061819` (Polygon Amoy)
- **기능**: 
  - `transferAndCall`: ERC-1363 표준으로 토큰 전송 + 콜백
  - `claimWithSignature`: EIP-712 서명 기반 토큰 클레임

#### PostLikeSystem1363 (좋아요 시스템)
- **주소**: `0xc5acB89285F9F0417A8172cd5530C5Ad15Cf41AA` (Polygon Amoy)
- **기능**:
  - `onTransferReceived`: ERC-1363 토큰 수신 시 자동 좋아요
  - `claimWithSignature`: EIP-712 서명 기반 게시글 보상 클레임

### 네트워크 지원
- **Polygon Amoy**: 테스트넷 (체인 ID: 80002)
- **Very**: 테스트넷 (체인 ID: 80002)

### 환경별 설정
- **Local**: 로컬 개발 환경
- **Production**: 배포/운영 환경

## 데이터베이스 스키마

### 주요 엔티티

#### User
- 기본 사용자 정보
- 지갑 주소 및 ELO 점수
- 튜토리얼 완료 상태

#### Post
- 게시글 정보
- 스포츠 카테고리 및 타입
- 좋아요/싫어요 수

#### UserElo
- 사용자별 스포츠 카테고리 ELO 점수
- 매치 결과 히스토리

#### TokenAccumulation
- 토큰 적립 내역
- 보상 타입별 분류
- 만료 시간 관리

#### MatchResult
- 매치 결과 정보
- 승자/패자 및 점수
- ELO 점수 변화

## 스케줄러

### HotPostsScheduler
- 인기 게시글 선별
- 핫 포스트 보상 지급

### MatchResultScheduler
- 매치 결과 처리
- ELO 점수 업데이트

### RealTimeHotPostsScheduler
- 실시간 인기 게시글 업데이트

### TempImageCleanupScheduler
- 임시 이미지 정리

## 테스트

### 백엔드 테스트
```bash
cd packages/backend

# 단위 테스트
npm run test:unit

# API 테스트
npm run test:api

# 전체 테스트
npm run test:all

# 커버리지 테스트
npm run test:cov
```

### 컨트랙트 테스트
```bash
cd packages/contracts

# 테스트 실행
npm test

# 특정 테스트 실행
npm test TrivusEXP1363.test.ts
```

### 튜토리얼 시스템 테스트
```bash
cd packages/backend
node scripts/test-tutorial-system.js
```

## 배포

### Docker 배포
```bash
# 이미지 빌드
docker build -t elo-community-backend .

# 컨테이너 실행
docker run -p 3000:3000 elo-community-backend
```

### Docker Compose 배포
```bash
cd infra
docker-compose -f docker-compose.yml up -d
```

### 환경변수 설정
배포 환경에 맞는 환경변수 파일 설정:
```bash
# .env.amoy.production 또는 .env.very.production
NETWORK=amoy
NODE_ENV=production
DB_PASSWORD=production_password
ADMIN_PRIV_KEY=production_private_key
```

## 모니터링 및 로깅

### 로그 레벨 설정
환경변수 `LOG_LEVEL`로 로그 레벨 조정:
- `error`: 에러만
- `warn`: 경고 + 에러
- `log`: 정보 + 경고 + 에러 (기본값)
- `debug`: 모든 로그


## 라이선스

© 2025 Trivus. All rights reserved.

## 연락처

프로젝트 관련 문의사항이 있으시면 이슈를 생성해 주세요.

구현: @dhrgodms123

## 변경 이력

### v0.0.1
- 초기 프로젝트 설정
- NestJS 백엔드 프레임워크 구성
- 블록체인 연동 시스템 구축
- ELO 시스템 구현
- 토큰 보상 시스템 구현
