# API 응답 표준 (실무 표준)

## 개요
모든 API는 일관된 응답 형식을 사용합니다. `success` 필드로 성공/실패를 명확히 구분하고, `data` 필드에 실제 데이터를 포함합니다.

## 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": {
    // 실제 데이터
  },
  "message": "Operation completed successfully"
}
```

### 실패 응답
```json
{
  "success": false,
  "message": "Error description"
}
```

## API별 응답 예시

### 1. 로그인 API

**성공 (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**실패 (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid idToken"
}
```

### 2. 댓글 목록 조회

**성공:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "첫 번째 댓글입니다",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "userId": 1,
      "userNickname": "사용자1",
      "postId": 1,
      "parentId": null,
      "depth": 0,
      "children": [...]
    }
  ],
  "message": "Comments retrieved successfully"
}
```

### 3. 사용자 프로필 조회

**성공:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "사용자",
    "walletAddress": "0x1234...",
    "walletUserId": "user123",
    "tokenAmount": 100.5,
    "availableToken": 50.2,
    "profileImageUrl": "https://...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "User profile retrieved successfully"
}
```

**실패 (사용자 없음):**
```json
{
  "success": false,
  "message": "User not found"
}
```

### 4. 게시글 생성

**성공:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "새 게시글",
    "content": "게시글 내용",
    "type": "general",
    "isHidden": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "authorId": 1,
    "authorNickname": "사용자1",
    "sportCategoryId": 1,
    "sportCategoryName": "축구"
  },
  "message": "Post created successfully"
}
```

## 실무에서 이 방식을 사용하는 이유

### 1. 프론트엔드 처리 편의성
```javascript
// 모든 API 응답을 일관되게 처리
const response = await api.getComments();
if (response.success) {
  // 성공 처리
  const comments = response.data;
  displayComments(comments);
} else {
  // 실패 처리
  showError(response.message);
}
```

### 2. 에러 핸들링의 일관성
```javascript
// 전역 에러 핸들러
const handleApiResponse = (response) => {
  if (!response.success) {
    showNotification(response.message, 'error');
    return false;
  }
  return response.data;
};
```

### 3. 미들웨어 처리 용이성
```javascript
// API 클라이언트 미들웨어
axios.interceptors.response.use(
  (response) => {
    if (response.data.success === false) {
      throw new Error(response.data.message);
    }
    return response.data;
  },
  (error) => {
    throw new Error('Network error');
  }
);
```

### 4. GraphQL과의 호환성
```javascript
// GraphQL 스타일과 유사한 응답 구조
{
  success: true,
  data: { posts: [...] },
  message: "Posts retrieved successfully"
}
```

### 5. 타입 안전성
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface Comment {
  id: number;
  content: string;
  // ...
}

// 타입 안전한 API 호출
const response: ApiResponse<Comment[]> = await api.getComments();
if (response.success && response.data) {
  // response.data는 Comment[] 타입
}
```

## 클라이언트 사용 예시

```javascript
// API 클라이언트
class ApiClient {
  async getComments() {
    const response = await fetch('/api/v1/comments');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  }
  
  async createComment(commentData) {
    const response = await fetch('/api/v1/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(commentData)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  }
}

// 사용 예시
const api = new ApiClient();

try {
  const comments = await api.getComments();
  console.log('댓글 목록:', comments);
} catch (error) {
  console.error('에러:', error.message);
}
```

## 장점

1. **일관성**: 모든 API가 동일한 응답 형식 사용
2. **명확성**: 성공/실패를 명확히 구분
3. **확장성**: 추가 필드 (errorCode, timestamp 등) 쉽게 추가 가능
4. **호환성**: GraphQL, REST 등 다양한 API 스타일과 호환
5. **디버깅**: 명확한 에러 메시지로 디버깅 용이 