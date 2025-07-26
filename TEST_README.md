# ELO Community API 테스트 가이드

## 🚀 빠른 시작

### 1. 테스트용 사용자 생성 API
```bash
# 테스트용 사용자 생성 (토큰 자동 발급)
curl -X POST http://localhost:3000/api/v1/auth/test-user
```

### 2. Postman 컬렉션 사용
1. `test_collection.json` 파일을 Postman에 import
2. 컬렉션 변수 설정:
   - `baseUrl`: `http://localhost:3000/api/v1`
3. "1. 테스트 사용자 생성" 요청 실행
4. 이후 요청들은 자동으로 토큰이 포함됨

### 3. Bash 스크립트 사용
```bash
# 실행 권한 부여
chmod +x test_api.sh

# 테스트 실행
./test_api.sh
```

## 🧪 Jest 테스트 실행

### 단위 테스트
```bash
# 모든 단위 테스트 실행
npm run test:unit

# 특정 서비스 테스트
npm test src/auth/auth.service.spec.ts
npm test src/controllers/auth.controller.spec.ts
```

### E2E 테스트
```bash
# API E2E 테스트 실행
npm run test:api

# 간단한 API 테스트 실행
npm run test:simple

# 모든 테스트 실행
npm run test:all
```

### 테스트 커버리지
```bash
npm run test:cov
```

## 📋 테스트 파일 구조

```
test/
├── api.e2e-spec.ts          # 전체 API E2E 테스트
├── simple-api.test.ts        # 간단한 API 테스트
├── helpers/
│   └── test-helper.ts       # 테스트 헬퍼 함수들
└── jest-e2e.json           # E2E 테스트 설정

src/
├── auth/
│   ├── auth.service.spec.ts # AuthService 단위 테스트
│   └── auth.controller.spec.ts # AuthController 단위 테스트
└── ...
```

## 🔧 테스트 헬퍼 사용법

### TestHelper 클래스
```typescript
import { TestHelper } from './test/helpers/test-helper';

const testHelper = new TestHelper(app);

// 테스트 사용자 생성
const user = await testHelper.createTestUser();

// 게시글 생성
const post = await testHelper.createTestPost(user);

// 댓글 생성
const comment = await testHelper.createTestComment(user, post.id);

// 대댓글 생성
const reply = await testHelper.createTestReply(user, comment.id);

// 전체 시나리오 실행
const result = await testHelper.createFullTestScenario();
```

## 🎯 테스트 시나리오

### 1. 인증 플로우
- 테스트 사용자 생성
- JWT 토큰 발급
- 토큰 검증

### 2. 게시글 플로우
- 게시글 생성
- 게시글 상세 조회 (댓글 포함)
- 게시글 목록 조회

### 3. 댓글 플로우
- 댓글 작성
- 댓글 목록 조회
- 특정 게시글의 댓글 조회

### 4. 대댓글 플로우
- 대댓글 작성
- 대댓글 목록 조회
- 특정 댓글의 대댓글 조회

### 5. 통합 플로우
- 사용자 → 게시글 → 댓글 → 대댓글 → 상세 조회

## 🛠️ 환경 설정

### 데이터베이스 설정
```bash
# 테스트용 데이터베이스 생성
createdb elo-community-test

# 환경 변수 설정
export DB_DATABASE=elo-community-test
```

### 환경 변수
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=elo-community-test
JWT_SECRET=your_jwt_secret
```

## 📊 테스트 결과 예시

### 성공적인 테스트 실행
```
✅ Test user created: { userId: 1, accessToken: "eyJhbGciOiJIUzI1NiIs..." }
✅ Post created: { postId: 1 }
✅ Comment created: { commentId: 1 }
✅ Reply created: { replyId: 1 }
✅ Post with details retrieved successfully
🎉 API 테스트 완료!
```

### Jest 테스트 결과
```
PASS  test/simple-api.test.ts
  Simple API Tests
    Full API Flow Test
      ✓ should complete full API flow (1234 ms)
    Individual Component Tests
      ✓ should create and verify test user (234 ms)
      ✓ should create post and retrieve with details (345 ms)
      ✓ should create comment and reply (456 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        2.345 s
```

## 🔍 문제 해결

### 일반적인 문제들

1. **데이터베이스 연결 실패**
   ```bash
   # PostgreSQL 서비스 확인
   sudo systemctl status postgresql
   
   # 데이터베이스 생성
   createdb elo-community-test
   ```

2. **포트 충돌**
   ```bash
   # 사용 중인 포트 확인
   lsof -i :3000
   
   # 프로세스 종료
   kill -9 <PID>
   ```

3. **JWT 토큰 문제**
   ```bash
   # JWT_SECRET 환경 변수 설정
   export JWT_SECRET=your_secret_key
   ```

### 디버깅 모드
```bash
# 디버그 모드로 테스트 실행
npm run test:debug

# 특정 테스트만 실행
npm test -- --testNamePattern="should create test user"
```

## 📝 추가 테스트 작성

### 새로운 API 테스트 추가
```typescript
// test/new-feature.test.ts
import { TestHelper } from './helpers/test-helper';

describe('New Feature Tests', () => {
  it('should test new feature', async () => {
    const testHelper = new TestHelper(app);
    const user = await testHelper.createTestUser();
    
    // 새로운 기능 테스트
    const response = await request(app.getHttpServer())
      .post('/api/v1/new-endpoint')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ data: 'test' })
      .expect(200);
      
    expect(response.body.success).toBe(true);
  });
});
```

이제 테스트를 쉽게 실행하고 API의 모든 기능을 검증할 수 있습니다! 🎉 