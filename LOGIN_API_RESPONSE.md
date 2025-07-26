# 로그인 API 응답 형식

## 개요
로그인 API는 REST API 표준을 따르며, HTTP 상태 코드로 성공/실패를 표현합니다. 성공 시에는 access token만 반환합니다.

## 성공 응답

### HTTP 상태 코드: 200 OK

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**응답 필드:**
- `accessToken`: JWT 액세스 토큰 (string)

## 실패 응답

### 1. 잘못된 토큰 (401 Unauthorized)

```json
{
  "message": "Invalid idToken"
}
```

### 2. 서버 오류 (500 Internal Server Error)

```json
{
  "message": "Login failed"
}
```

## HTTP 상태 코드

| 상태 코드 | 의미 | 설명 |
|-----------|------|------|
| 200 | OK | 로그인 성공 |
| 401 | Unauthorized | 잘못된 토큰 또는 인증 실패 |
| 500 | Internal Server Error | 서버 오류 |

## 사용자 정보 조회

로그인 후 사용자 정보가 필요한 경우 별도 API를 사용합니다:

```http
GET /api/v1/users/me
Authorization: Bearer <accessToken>
```

**응답 예시:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "nickname": "사용자",
  "walletAddress": "0x1234...",
  "walletUserId": "user123",
  "tokenAmount": 100.5,
  "availableToken": 50.2,
  "profileImageUrl": "https://...",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## 보안 특징

1. **최소한의 정보 노출**: 로그인 응답에는 민감한 정보가 포함되지 않음
2. **토큰 기반 인증**: JWT 토큰으로 후속 API 호출 인증
3. **실시간 사용자 정보**: 필요할 때마다 최신 사용자 정보 조회
4. **REST API 표준**: HTTP 상태 코드로 성공/실패 표현

## 클라이언트 처리 예시

```javascript
// 로그인 요청
const loginResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    idToken: 'user_id_token_here',
    email: 'user@example.com',
    accounts: [...]
  })
});

if (loginResponse.ok) {
  const loginData = await loginResponse.json();
  
  // 토큰 저장
  localStorage.setItem('accessToken', loginData.accessToken);
  
  // 사용자 정보 조회 (필요시)
  const userResponse = await fetch('/api/v1/users/me', {
    headers: {
      'Authorization': `Bearer ${loginData.accessToken}`
    }
  });
  
  if (userResponse.ok) {
    const userData = await userResponse.json();
    // 사용자 정보 처리
  }
} else {
  // 에러 처리
  const errorData = await loginResponse.json();
  console.error('Login failed:', errorData.message);
}
```

## REST API 표준

이 API는 REST API 표준을 따릅니다:

- **HTTP 상태 코드 사용**: 성공/실패를 상태 코드로 표현
- **JSON 응답**: 구조화된 JSON 응답
- **명확한 에러 메시지**: 에러 시 명확한 메시지 제공
- **일관된 형식**: 모든 API가 일관된 응답 형식 사용 