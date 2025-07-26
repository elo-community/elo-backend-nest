#!/bin/bash

# API 테스트 스크립트
BASE_URL="http://localhost:3000/api/v1"

echo "🚀 ELO Community API 테스트 시작..."

# 1. 테스트 사용자 생성
echo "📝 1. 테스트 사용자 생성 중..."
USER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/test-user" \
  -H "Content-Type: application/json")

echo "사용자 생성 응답: $USER_RESPONSE"

# 토큰 추출
ACCESS_TOKEN=$(echo $USER_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ 토큰을 가져올 수 없습니다."
    exit 1
fi

echo "✅ 토큰 획득: ${ACCESS_TOKEN:0:20}..."

# 2. 토큰 검증
echo "🔐 2. 토큰 검증 중..."
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

echo "토큰 검증 응답: $VERIFY_RESPONSE"

# 3. 게시글 생성
echo "📄 3. 게시글 생성 중..."
POST_RESPONSE=$(curl -s -X POST "$BASE_URL/posts" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "테스트 게시글",
    "content": "이것은 테스트용 게시글입니다.",
    "type": "post",
    "isHidden": false
  }')

echo "게시글 생성 응답: $POST_RESPONSE"

# 게시글 ID 추출
POST_ID=$(echo $POST_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ -z "$POST_ID" ]; then
    echo "❌ 게시글 ID를 가져올 수 없습니다."
    exit 1
fi

echo "✅ 게시글 생성 완료 (ID: $POST_ID)"

# 4. 게시글 상세 조회
echo "👀 4. 게시글 상세 조회 중..."
POST_DETAIL_RESPONSE=$(curl -s -X GET "$BASE_URL/posts/$POST_ID")

echo "게시글 상세 조회 응답: $POST_DETAIL_RESPONSE"

# 5. 댓글 작성
echo "💬 5. 댓글 작성 중..."
COMMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/comments" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"content\": \"테스트 댓글입니다.\",
    \"postId\": $POST_ID
  }")

echo "댓글 작성 응답: $COMMENT_RESPONSE"

# 댓글 ID 추출
COMMENT_ID=$(echo $COMMENT_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ -n "$COMMENT_ID" ]; then
    echo "✅ 댓글 작성 완료 (ID: $COMMENT_ID)"
    
    # 6. 대댓글 작성
    echo "💬 6. 대댓글 작성 중..."
    REPLY_RESPONSE=$(curl -s -X POST "$BASE_URL/replies" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"content\": \"테스트 대댓글입니다.\",
        \"commentId\": $COMMENT_ID
      }")
    
    echo "대댓글 작성 응답: $REPLY_RESPONSE"
    
    REPLY_ID=$(echo $REPLY_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
    if [ -n "$REPLY_ID" ]; then
        echo "✅ 대댓글 작성 완료 (ID: $REPLY_ID)"
    else
        echo "❌ 대댓글 작성 실패"
    fi
else
    echo "❌ 댓글 작성 실패"
fi

echo "🎉 API 테스트 완료!" 