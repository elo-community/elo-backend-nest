# 튜토리얼 토큰 시스템

## 개요
사용자가 플랫폼을 처음 사용할 때 특정 액션을 완료하면 토큰을 지급하는 튜토리얼 시스템입니다.

## 토큰 지급 조건

### 1. 첫글 작성 보상
- **액션**: 사용자가 첫 번째 글을 작성
- **보상**: 3 EXP 토큰
- **중복 방지**: 한 번만 지급 가능

### 2. 첫 매치결과 등록 보상
- **액션**: 사용자가 첫 번째 매치결과를 등록
- **보상**: 5 EXP 토큰
- **중복 방지**: 한 번만 지급 가능

## 시스템 구조

### 데이터베이스 스키마

#### User 테이블 추가 필드
```sql
ALTER TABLE `user` 
ADD COLUMN `tutorial_first_post_completed` BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN `tutorial_first_match_completed` BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN `tutorial_first_post_completed_at` TIMESTAMP NULL,
ADD COLUMN `tutorial_first_match_completed_at` TIMESTAMP NULL;
```

#### TokenAccumulation 테이블 새로운 타입
- `TUTORIAL_FIRST_POST`: 첫글 작성 보상
- `TUTORIAL_FIRST_MATCH`: 첫 매치결과 등록 보상

### 서비스 구조

#### UserService
- `completeTutorialFirstPost()`: 첫글 작성 튜토리얼 완료 처리
- `completeTutorialFirstMatch()`: 첫 매치결과 등록 튜토리얼 완료 처리
- `getTutorialStatus()`: 사용자의 튜토리얼 완료 상태 조회

#### TokenAccumulationService
- `accumulateTutorialFirstPostReward()`: 첫글 작성 보상 토큰 적립
- `accumulateTutorialFirstMatchReward()`: 첫 매치결과 등록 보상 토큰 적립

#### PostService & MatchResultService
- 각각의 create 메서드에서 자동으로 튜토리얼 완료 상태 체크
- 완료되지 않은 경우 자동으로 토큰 지급

## API 엔드포인트

### 튜토리얼 상태 조회
```
GET /users/tutorial-status
Authorization: Bearer {JWT_TOKEN}
```

**응답 예시:**
```json
{
  "firstPostCompleted": false,
  "firstMatchCompleted": false,
  "firstPostCompletedAt": null,
  "firstMatchCompletedAt": null
}
```

## 중복 지급 방지 로직

### 1. User 엔티티 레벨
- `tutorial_first_post_completed`: 첫글 작성 완료 여부
- `tutorial_first_match_completed`: 첫 매치결과 등록 완료 여부
- Boolean 필드로 완료 상태를 명확하게 추적

### 2. TokenAccumulation 레벨
- 동일한 타입의 중복 적립 방지
- 이미 적립된 경우 에러 발생

### 3. 에러 처리
- 이미 완료된 경우 에러 발생하지만 로그만 남김
- 사용자 경험에 영향을 주지 않음

## 토큰 지급 흐름

```
1. 사용자 액션 수행
   ↓
2. 서비스에서 튜토리얼 완료 상태 확인
   ↓
3. 완료되지 않은 경우 TokenAccumulation 생성
   ↓
4. User 테이블의 튜토리얼 상태 업데이트
   ↓
5. availableToken 자동 업데이트
   ↓
6. 사용자가 토큰을 수확할 수 있음
```

## 설정 및 환경변수

### 토큰 수량 설정
- 첫글 작성: 3 EXP (코드에서 하드코딩)
- 첫 매치결과 등록: 5 EXP (코드에서 하드코딩)

### 만료 시간
- TokenAccumulation: 24시간 후 만료
- 클레임 기한: 1시간

## 테스트

### 테스트 스크립트 실행
```bash
cd packages/backend
node scripts/test-tutorial-system.js
```

### 수동 테스트 시나리오
1. 새 사용자로 첫 글 작성 → 3 EXP 지급 확인
2. 동일 사용자로 두 번째 글 작성 → 토큰 지급 안됨 확인
3. 새 사용자로 첫 매치결과 등록 → 5 EXP 지급 확인
4. 동일 사용자로 두 번째 매치결과 등록 → 토큰 지급 안됨 확인

## 모니터링 및 로깅

### 로그 확인
- 튜토리얼 완료 시: `Tutorial first post completed for user {id}`
- 중복 시도 시: `Tutorial first post check failed for user {id}: Tutorial first post already completed`

### 데이터베이스 모니터링
```sql
-- 튜토리얼 완료 상태 조회
SELECT 
    id, 
    wallet_address, 
    tutorial_first_post_completed,
    tutorial_first_match_completed,
    tutorial_first_post_completed_at,
    tutorial_first_match_completed_at
FROM `user` 
WHERE tutorial_first_post_completed = true 
   OR tutorial_first_match_completed = true;

-- 튜토리얼 토큰 적립 현황
SELECT 
    type, 
    COUNT(*) as count, 
    SUM(amount) as total_amount
FROM token_accumulations 
WHERE type IN ('tutorial_first_post', 'tutorial_first_match')
GROUP BY type;
```

## 향후 확장 가능성

### 추가 튜토리얼 액션
- 첫 댓글 작성
- 첫 좋아요 누르기
- 프로필 이미지 설정
- 스포츠 카테고리 선택

### 동적 보상 시스템
- 사용자 레벨에 따른 보상 차등화
- 계절별 이벤트 보상
- 연속 달성 보너스

### 관리자 기능
- 튜토리얼 보상 수량 조정
- 사용자별 튜토리얼 상태 초기화
- 튜토리얼 통계 대시보드

## 주의사항

1. **데이터베이스 마이그레이션**: 새로운 필드 추가 전 반드시 백업
2. **기존 사용자**: 기존 사용자들은 기본적으로 false 상태
3. **토큰 수량**: 현재 하드코딩되어 있으므로 변경 시 코드 수정 필요
4. **에러 처리**: 튜토리얼 실패가 메인 기능에 영향을 주지 않도록 설계

## 문제 해결

### 일반적인 문제
- **토큰이 지급되지 않는 경우**: 사용자의 wallet_address 확인
- **중복 지급 에러**: 이미 완료된 튜토리얼인지 확인
- **availableToken 업데이트 안됨**: updateAvailableTokens 메서드 호출 확인

### 디버깅 방법
1. 로그 확인
2. 데이터베이스 상태 확인
3. API 응답 확인
4. 사용자 튜토리얼 상태 조회
