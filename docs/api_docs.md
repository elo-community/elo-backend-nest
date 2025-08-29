# Trivus API Documentation
- `v1`: 2025.08.~
	- path header: `/api/v1/`
	- swagger: https://localhost:3000/api/docs

<br><br>

---
# <mark style="background: #ABF7F7A6;">Auth </mark>
### `/api/v1/auth/login`
- 위핀 지갑으로 로그인하여 자동 회원가입

#### Request Body 예시
- 위핀 지갑 로그인 시 받은 body 값 중 아래 값을 request body로 이용
```json
{ 
	"idToken": "eyJh…", 
	"email": "[123example@gmail.com](mailto:123example@gmail.com)",
	"accounts": 
	[ 
		{ 
			"network": "evmPOLYGON", 
			"address": "0x0123..." 
		}, 
		{ 
			"network": "evmVERY",
			"address": "0x0123..." 
		}, 
		{ 
			"network": "evmPOLYGON-Amoy", 
			"address": "0x0123..." 
		} 
	] 
}
```

#### Response 예시
```json
{
    "success": true,
    "data": {
        "accessToken": "eyJh...",
        "user": {
            "id": 1,
            "email": "123example@gmail.com",
            "nickname": null,
            "walletAddress": "0x0123..",
            "profileImageUrl": "https://...",
            "tokenAmount": "0.00000000",
            "availableToken": "0.00000000"
        }
    },
    "message": "Login successful"
}
```

<br><br>

---

# <mark style="background: #ABF7F7A6;">Users </mark>
- 유저 관련 정보, 활동 정보 등

### `GET /api/v1/users/{user-id}/profile`
- 유저 프로필 조회

#### Request URL예시
- user-id=1
```
https://localhost:3000/api/v1/users/1/profile
```

#### Response 예시
```json
{
  "user": {
    "id": 1,
    "email": "sample@example.com",
    "nickname": "샘플유저",
    "walletAddress": "0x46AAb404E4B7C8335Be7BF111dcc11Df2eD4d348",
    "profileImageUrl": null,
    "tokenAmount": "109.00000000",
    "availableToken": "3.00000000"
  },
  "userElos": [
    {
      "id": 1,
      "sportCategory": {
        "id": 2,
        "name": "테니스"
      },
      "eloPoint": 1400,
      "tier": "BRONZE",
      "percentile": "50.00"
    },
    ...
  ]
}
```
- 매치 결과 이력이 없으면 해당 종목 null

<br><br>

### `GET /api/v1/users/{user-id}/posts`
- 유저가 작성한 커뮤니티 게시글 조회

#### Request URL예시
```
https://localhost:3000/api/v1/users/1/posts
```

#### Response 예시
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "title": "안녕하세요!",
            "content": "처음 가입했습니다. 반갑습니다!",
            "type": "general",
            "isHidden": false,
            "viewCount": 0,
            "commentCount": 0,
            "createdAt": "2025-08-25T12:48:18.414Z",
            "updatedAt": "2025-08-25T12:48:18.414Z",
            "author": {
                "id": 1,
                "nickname": "샘플유저",
                "profileImageUrl": null
            },
            "sportCategoryId": 1,
            "sportCategoryName": "자유글",
            "isLiked": false,
            "isHated": false,
            "likeCount": 0,
            "hateCount": 0,
            "imageUrls": []
        }
    ],
    "message": "User posts retrieved successfully"
}
```
- 최근 작성 순으로 정렬

<br><br>

### `GET /api/v1/users/{user-id}/token`
- 유저 소유 토큰(EXP) 조회
- Bearer 토큰 필요

#### Request URL예시
```
https://localhost:3000/api/v1/users/1/tokens
```

#### Response 예시
```json
{
    "success": true,
    "data": {
        "userId": 1,
        "walletAddress": "0x46AAb404E4B7C8335Be7BF111dcc11Df2eD4d348",
        "totalTokens": "109.00000000",
        "availableTokens": "3.00000000"
    },
    "message": "User token info retrieved successfully"
}
```

<br><br>

### `GET /api/v1/users/me/match-results`
- 유저의 등록한 경기 이력 조회
- Bearer 토큰 필요

#### Request URL 예시
```
https://localhost:3000/api/v1/users/1/match-results
```


#### Response 예시
```json
{
    "success": true,
    "data": {
        "matches": [
            {
                "id": 2,
                "partner": 2,
                "partner_nickname": "탁구왕민수",
                "sportCategory": "탁구",
                "result": "win",
                "isHandicap": false,
                "created_at": "2025-08-28T08:15:41.974Z",
                "elo_before": 1400,
                "elo_after": 1410,
                "elo_delta": 10,
                "partner_elo_before": 1400,
                "partner_elo_after": 1390,
                "partner_elo_delta": -10,
                "partner_current_elo": 1390,
                "my_wins": 1,
                "my_losses": 0,
                "my_draws": 0,
                "my_total_matches": 1,
                "partner_wins": 0,
                "partner_losses": 1,
                "partner_draws": 0,
                "partner_total_matches": 1
            }
        ]
    },
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1,
        "hasNext": false,
        "hasPrev": false
    },
    "message": "Match history retrieved successfully"
}
```

<br><br>

---
# <mark style="background: #ABF7F7A6;">SportsCategories</mark>
- 종목 카테고리

### `GET /api/v1/sports-categories
- 스포츠 종목 카테고리 Id, Name, 정렬 순서 조회

#### Request URL 예시
```
http://localhost:3000/api/v1/sports-categories
```
- `categoryId`: 카테고리 Id
- `limit`: 게시글 개수
- `page`: 페이지 넘버

#### Response 예시
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "자유글",
            "sortOrder": 1
        },
        {
            "id": 2,
            "name": "테니스",
            "sortOrder": 2
        },
        ...
        {
            "id": 8,
            "name": "공지사항",
            "sortOrder": 8
        }
    ],
    "message": "Sport categories retrieved successfully"
}
```

<br><br>

---
# <mark style="background: #ABF7F7A6;">MatchResults</mark>
- 경기 이력
- 유저가 직접 등록
- Bearer 토큰 필요

### `POST /api/v1/match-results`
- 경기 결과 등록(생성)

#### Request body 예시
```json
{
  "partnerNickname": "샘플유저",
  "sportCategoryId": 2,
  "senderResult": "win",
  "isHandicap": false
}
```

#### Response 예시
```json
{
    "success": true,
    "data": {
        "id": 3,
        "partnerId": 2,
        "partnerNickname": "탁구왕민수",
        "senderId": 1,
        "senderNickname": "샘플유저",
        "sportCategoryId": 2,
        "sportCategoryName": "테니스",
        "senderResult": "win",
        "isHandicap": false,
        "status": "pending",
        "expiredTime": "2025-08-28T22:50:30.198Z",
        "createdAt": "2025-08-28T10:50:30.199Z",
        "playedAt": "2025-08-28T10:50:30.198Z",
        "playedDate": "2025-08-27T15:00:00.000Z",
        "confirmedAt": null,
        "partnerResult": "lose"
    },
    "message": "Match request created successfully"
}
```

<br><br>

### `POST /api/v1/match-results/{match-result-id}/respond`
- 상대방의 경기 결과 등록 신청에 승인
- Bearer 토큰 필요

#### Request body 예시
```json
{ 
    "action": "accept"
}
```
- `action`: 승인: "accept", 거부: "reject"
#### Response 예시
```json
{
    "success": true,
    "data": {
        "id": 2,
        "partnerId": 2,
        "partnerNickname": "탁구왕민수",
        "senderId": 1,
        "senderNickname": "샘플유저",
        "sportCategoryId": 4,
        "sportCategoryName": "탁구",
        "senderResult": "win",
        "isHandicap": false,
        "status": "accepted",
        "expiredTime": "2025-08-28T20:15:41.972Z",
        "createdAt": "2025-08-28T08:15:41.974Z",
        "playedAt": "2025-08-28T08:15:41.967Z",
        "playedDate": "2025-08-28",
        "confirmedAt": "2025-08-28T10:06:59.950Z",
        "partnerResult": "lose"
    },
    "message": "Match request accepted successfully"
}
```

<br><br>

### `GET /api/v1/match-results/{match-result-id}`
- 상대방의 경기 결과 등록 단일 조회

#### Request URL 예시
```
http://localhost:3000/api/v1/match-results/1
```

#### Response 예시
```json
{
    "success": true,
    "data": {
        "id": 1,
        "partnerId": 2,
        "partnerNickname": "탁구왕민수",
        "senderId": 1,
        "senderNickname": "샘플유저",
        "sportCategoryId": 4,
        "sportCategoryName": "탁구",
        "senderResult": "win",
        "isHandicap": false,
        "status": "expired",
        "expiredTime": "2025-08-25T12:50:18.545Z",
        "createdAt": "2025-08-25T12:48:18.545Z",
        "playedAt": "2025-08-25T12:48:18.542Z",
        "playedDate": "2025-08-25",
        "confirmedAt": null,
        "partnerResult": "lose"
    },
    "message": "Match result retrieved successfully"
}
```

<br><br>

---
# <mark style="background: #ABF7F7A6;">Elo</mark>
- 경기 등록 시 elo 변화 미리보기
- Bearer 토큰 필요

### `POST /api/v1/elo/preview`
- 경기 결과 등록 시 elo 변화 미리 조회

#### Request body 예시
```json
{
	"sportCategoryId": 1,
	"aId": 10,
	"bId": 22,
	"result": "lose",
	"isHandicap": true
}
```

#### Response 예시
```json
{
    "success": true,
    "data": {
        "aOld": 1400,
        "aNew": 1397,
        "aDelta": -3,
        "bOld": 1400,
        "bNew": 1403,
        "bDelta": 3,
        "kEff": 6,
        "h2hGap": 0,
        "expectedA": 0.5,
        "expectedB": 0.5
    },
    "message": "Elo calculation preview completed successfully"
}
```

<br><br>

---
# <mark style="background: #ABF7F7A6;">Contract 관련 api</mark>
- contract에 보낼 서명값을 생성하는 api

### `POST /api/v1/token-transactions/claim-all-accumulated`
- 수확하여 쌓아둔 토큰을 claim하기 전 매개변수에 담을 값을 받는 요청
- 쌓인 토큰(user의 available_token)만큼 한 번에 claim
- Bearer 토큰 필요

#### Request body 예시
```json
{
  "address": "0x46AAb404E4B7C8335Be7BF111dcc11Df2eD4d348",
  "reason": "hot_post_reward"
}
```

#### Response 예시
```json
{
    "success": true,
    "data": {
        "to": "0x46...",
        "amount": "8.0",
        "deadline": 1756383005,
        "nonce": "0xb6....",
        "signature": "0x59....",
        "contractAddress": "0x0123...",
        "contractABI": [
            // ABI
        ],
        "userTokenInfo": {
            "availableTokens": "8.00000000",
            "totalTokens": "109.00000000",
            "pendingTokens": 8
        },
        "message": "Use this signature to execute the claim on the blockchain. You are claiming 8.00000000 EXP. The transaction will be recorded automatically when the claim is executed."
    },
    "message": "Token claim signature generated successfully"
}
```

<br><br>

### `POST /api/v1/post-like-signature/likes/data`
- 좋아요를 누르기 전 컨트랙트 call(1토큰 전송)에 들어갈 매개변수를 반환하는 api
- Bearer 토큰 필요

#### Request body 예시
```json
{
    "postId":"12"
}
```

#### Response 예시
```json
{
    "success": true,
    "data": {
        "postId": "12",
        "to": "0x0123..",
        "encodedData": "0x0000...",
        "contractAddress": "0x0123...",
        "contractABI": [
            //ABI
        ],
        "userTokenInfo": {
            "currentBalance": "109.00000000",
            "requiredAmount": 1
        }
    },
    "message": "Like data created successfully"
}
```
- `to`: 1토큰을 전송할 post-like-system 컨트랙트의 주소

<br><br>

### `POST /api/v1/post-like-signature/create`
- 내 게시글에 쌓인 좋아요 토큰을 claim
- Bearer 토큰 필요

#### Request body 예시
```json
{
    "postId":"11",
    "userAddress":"0x0123..."
}
```

#### Response 예시
```json
{
    "success": true,
    "data": {
        "postId": "11",
        "to": "0x46AAb404E4B7C8335Be7BF111dcc11Df2eD4d348",
        "amount": "1.0",
        "deadline": 1756380180,
        "nonce": "0x6ccf51262f0a39f9bd7291bf8ed6a147aabb0ec14dd698daab08f2dccad6ce8a",
        "signature": "0x3936c49953260d4d3fdceb3ea8fd87e4e022031cbbbdef06645ae389c218a0cf6fa2e9ac381225472cd6ba06e563dbf1150267ea4edf987013a18270bdddf9691b",
        "contractAddress": "0xc5acB89285F9F0417A8172cd5530C5Ad15Cf41AA",
        "contractABI": [
            {
                //ABI
        ]
    },
    "message": "Like signature created successfully"
}
```

<br><br>

---
# <mark style="background: #ABF7F7A6;">TokenTransactions</mark>
- token transaction 내역 조회

### `GET /api/v1/token-transactions`
- token(EXP)를 주고 받은 이력을 조회
- Bearer 토큰 필요

#### Request body 예시
```
http://localhost:3000/api/v1/token-transactions
```

- `page`: 페이지 번호(기본값:1)
- `limit`: 페이지 당 가져올 개수(기본값:20)

#### Response 예시
```json
{
    "message": "User token transactions retrieved successfully",
    "data": {
        "transactions": [
            {
                "id": 2,
                "user": {
                    "id": 1,
                    "nickname": "샘플유저",
                    "walletAddress": "0x0123.."
                },
                "transactionType": "INITIAL_SYNC",
                "status": "COMPLETED",
                "transactionHash": null,
                "description": "Initial token balance sync: 0.00000000 → 109 EXP",
                "metadata": {
                    "action": "initial_sync",
                    "source": "system",
                    "context": "initial_sync",
                    "reference_id": null,
                    "reference_type": "initial_sync",
                    "balance_before": "0.00000000",
                    "balance_after": 109,
                    "available_token_before": "3.00000000",
                    "available_token_after": "3.00000000",
                    "sync_type": "initial_server_startup",
                    "change_amount": 109,
                    "current_balance": 109,
                    "previous_balance": "0.00000000"
                },
                "processedAt": "2025-08-29T01:12:04.814Z",
                "summary": {
                    "action": "초기 동기화",
                    "target": "블록체인",
                    "reason": "서버 시작 시 토큰 잔액 동기화",
                    "amount": "109 EXP",
                    "direction": "earned",
                    "timestamp": "2025. 8. 29. 오전 10:12:04"
                }
            }
        ],
        "user": {
            "id": 1,
            "walletUserId": "sample-user",
            "walletAddress": "0x0123..",
            "nickname": "샘플유저",
            "email": "sample@example.com",
            "createdAt": "2025-08-29T01:12:03.851Z",
            "tokenAmount": "109.00000000",
            "availableToken": "3.00000000",
            "lastTokenSyncAt": "2025-08-29T01:12:04.812Z",
            "profileImageUrl": null,
            "tutorialFirstPostCompleted": true,
            "tutorialFirstMatchCompleted": false,
            "tutorialFirstPostCompletedAt": "2025-08-29T01:12:03.890Z",
            "tutorialFirstMatchCompletedAt": null
        },
        "total": 1,
        "page": 1,
        "limit": 20,
        "totalPages": 1
    }
}
```

- `referenceId`: 연관 게시글 id

<br><br>

### `GET /api/v1/token-accumulations`
- 인기글 보상이나, 튜토리얼 보상 등으로 쌓인 token(EXP)를 이력을 조회(available_token)
- Bearer 토큰 필요

#### Request body 예시
```
http://localhost:3000/api/v1/token-accumulations
```

- `page`: 페이지 번호(기본값:1)
- `limit`: 페이지 당 가져올 개수(기본값:20)

#### Response 예시
```json
{
    "message": "User token accumulations retrieved successfully",
    "data": {
        "accumulations": [
            {
                "id": 1,
                "walletAddress": "0x0123...",
                "reason": "Tutorial: First post reward",
                "amount": 3,
                "type": "tutorial_first_post",
                "nonce": "0x01234..",
                "status": "pending",
                "claimTxHash": null,
                "claimedAt": null,
                "createdAt": "2025-08-29T01:43:13.693Z",
                "updatedAt": "2025-08-29T01:43:13.693Z",
                "metadata": {
                    "tutorial_type": "first_post"
                },
                "summary": {
                    "action": "튜토리얼 첫 게시글",
                    "source": "튜토리얼",
                    "reason": "Tutorial: First post reward",
                    "amount": "3 EXP",
                    "status": "대기 중",
                    "canClaim": true
                }
            }
        ],
        "total": 1,
        "page": 1,
        "limit": 20,
        "totalPages": 1,
        "summary": {
            "totalPending": 0,
            "totalClaimed": 0,
            "totalExpired": 0,
            "totalAmount": 0
        }
    }
}
```


<br><br>

---
# <mark style="background: #ABF7F7A6;">MatchPosts</mark>
- 매칭 글 조회/작성

### `POST /api/v1/match-posts`
- 매칭 게시글 작성

#### Request body 예시
```json
{
    "sportCategoryId": 2,
    "title": "테니스 2:2 매칭 구합니다",
    "content": "강남구 테니스장에서 2:2 매칭 구합니다",
    "type": "매치",
    "matchLocation": "강남구 테니스장",
    "myElo": 1200,
    "preferredElo": "similar",
    "participantCount": "4"  // 2:2 (4명)
}
```


#### Response 예시
```json
{
    "success": true,
    "data": {
        "id": 21,
        "author": {
            "id": 1,
            "walletUserId": "sample-user",
            "walletAddress": "0x0123..",
            "nickname": "샘플유저",
            "email": "sample@example.com",
            "createdAt": "2025-08-25T12:48:18.382Z",
            "tokenAmount": "109.00000000",
            "availableToken": "8.00000000",
            "lastTokenSyncAt": null,
            "profileImageUrl": null,
            "tutorialFirstPostCompleted": true,
            "tutorialFirstMatchCompleted": true,
            "tutorialFirstPostCompletedAt": "2025-08-25T12:48:18.440Z",
            "tutorialFirstMatchCompletedAt": "2025-08-28T10:07:00.068Z"
        },
        "content": "강남구 테니스장에서 2:2 매칭 구합니다",
        "createdAt": "2025-08-28T11:24:14.589Z",
        "updatedAt": "2025-08-28T11:24:14.589Z",
        "title": "테니스 2:2 매칭 구합니다",
        "type": "match",
        "isHidden": false,
        "viewCount": 0,
        "sportCategory": {
            "id": 2,
            "name": "테니스",
            "sortOrder": 2
        },
        "imageUrls": [],
        "matchLocation": "강남구 테니스장",
        "myElo": 1200,
        "preferredElo": "similar",
        "participantCount": "4",
        "matchStatus": "대기중",
        "deadline": "2025-09-11T11:24:14.588Z",
        "matchDate": null
    }
}
```
<br><br>

### `GET /api/v1/match-posts`
- 매칭 게시글 전체 조회

#### Request body 예시
```json
{
    "sportCategoryId": 2,
    "title": "테니스 2:2 매칭 구합니다",
    "content": "강남구 테니스장에서 2:2 매칭 구합니다",
    "type": "매치",
    "matchLocation": "강남구 테니스장",
    "myElo": 1200,
    "preferredElo": "similar",
    "participantCount": "4"  // 2:2 (4명)
}
```


#### Response 예시
```json
{
    "success": true,
    "data": {
        "posts": [
            {
                "id": 21,
                "author": {
                    //user 정보
                },
                "content": "강남구 테니스장에서 2:2 매칭 구합니다",
                "createdAt": "2025-08-28T11:24:14.589Z",
                "updatedAt": "2025-08-28T11:24:14.589Z",
                "title": "테니스 2:2 매칭 구합니다",
                "type": "match",
                "isHidden": false,
                "viewCount": 0,
                "sportCategory": {
                    "id": 2,
                    "name": "테니스",
                    "sortOrder": 2
                },
                "imageUrls": [],
                "matchLocation": "강남구 테니스장",
                "myElo": 1200,
                "preferredElo": "similar",
                "participantCount": 4,
                "matchStatus": "대기중",
                "deadline": "2025-09-11T11:24:14.588Z",
                "matchDate": null,
                "participants": { 
                    "confirmed": [],
                    "pending": [],
                    "rejected": []
                }
            }
        ],
        "total": 4,
        "page": 1,
        "limit": 10,
        "totalPages": 1
    }
}
```

<br><br>

### `GET /api/v1/posts/{post-id}`
- 매칭 게시글 단일 조회
- 커뮤니티 게시글 단일 조회와 동일

#### Request body 예시
```
http://localhost:3000/api/v1/posts/18
```


#### Response 예시
```json
{
    "success": true,
    "data": {
        "id": 18,
        "title": "탁구 1:1 연습 상대 구합니다",
        "content": "서초구 탁구장에서 1:1 연습 상대를 구합니다. 초급자도 환영합니다.",
        "type": "match",
        "sportCategoryId": 4,
        "author": {
            "id": 1,
            "nickname": "샘플유저",
            "profileImageUrl": null
        },
        "createdAt": "2025-08-25T12:48:18.528Z",
        "updatedAt": "2025-08-28T11:36:24.138Z",
        "matchInfo": {
            "matchLocation": "서초구 탁구장",
            "myElo": 800,
            "preferredElo": "any",
            "status": "대기중",
            "participantCount": 2,
            "createdAt": "2025-08-25T12:48:18.528Z",
            "deadline": "2025-08-30T12:48:18.522Z",
            "matchDate": "2025-08-27T12:48:18.522Z"
        },
        "participants": {
            "confirmed": [
	            {
                    "userId": 2,
                    "nickname": "탁구왕민수",
                    "profileImageUrl": null,
                    "elo": 1420,
                    "requestedAt": "2025-08-28T11:27:36.325Z",
                    "message": "저도 참가하고 싶습니다!"
                }
            ],
            "pending": [],
            "rejected": []
        }
    },
    "message": "Match post with details retrieved successfully"
}
```
- `participants`: 응답 처리 상태에 따라 반환

<br><br>

### `POST /api/v1/match-posts/request`
- 매칭 글에 매치 요청

#### Request body 예시
```json
{
    "postId": 18,
    "message": "저도 참가하고 싶습니다!"
}
```

#### Response 예시
```json
{
    "success": true,
    "data": {
        "id": 1,
        "post": {
            //post 정보
        },
        "user": {
	        //신청한 user 정보
        },
        "status": "pending",
        "message": "저도 참가하고 싶습니다!",
        "userElo": null,
        "respondedAt": null,
        "responseMessage": null,
        "createdAt": "2025-08-28T11:27:36.325Z",
        "updatedAt": "2025-08-28T11:27:36.325Z"
    }
}
```
<br><br>


### `POST /api/v1/match-posts/respond`
- 매칭 게시글에 매치 승인

#### Request body 예시
```json
{
    "postId": 18,
    "action": "accept",
    "responseMessage": "환영합니다!"
}
```
- `action`: 승인: "accept", 거부: "reject"

#### Response 예시
```json
{
    "success": true,
    "data": {
        "id": 1,
        "user": {
            //신청한 사람
        },
        "status": "accepted",
        "message": "저도 참가하고 싶습니다!",
        "userElo": 1400,
        "respondedAt": "2025-08-28T11:30:20.003Z",
        "responseMessage": "환영합니다!",
        "createdAt": "2025-08-28T11:27:36.325Z",
        "updatedAt": "2025-08-28T11:30:20.006Z"
    }
}
```


<br><br>
---
# <mark style="background: #ABF7F7A6;">Posts</mark>
- 게시글 작성/조회

### `GET /api/v1/posts`
- 게시글 조회

#### Request URL 예시
```
http://localhost:3000/api/v1/posts?categoryId=2&limit=3&page=1
```
- `categoryId`: 카테고리 Id
- `limit`: 게시글 개수
- `page`: 페이지 넘버

- option
	- `type`: post의 type("match", "normal" 등)

#### Response 예시
```json
{
  "success": true,
  "data": [
    {
      "id": 19,
      "title": "배드민턴 복식 파트너 구합니다",
      "content": "마포구 배드민턴장에서 복식 파트너를 구합니다. 여성 선수 우선입니다.",
      "type": "match",
      "sportCategoryId": 3,
      "author": {
        "id": 1,
        "nickname": "샘플유저",
        "profileImageUrl": null
      },
      "createdAt": "2025-08-25T12:48:18.532Z",
      "updatedAt": "2025-08-25T12:48:18.532Z",
      "matchInfo": {
        "matchLocation": "마포구 배드민턴장",
        "myElo": 1000,
        "preferredElo": "similar",
        "status": "대기중",
        "participantCount": 2,
        "createdAt": "2025-08-25T12:48:18.532Z",
        "deadline": "2025-09-04T12:48:18.522Z",
        "matchDate": "2025-08-29T12:48:18.522Z"
      },
      "participants": {
        "confirmed": [],
        "pending": [],
        "rejected": []
      }
    },
    {
      //post2
    },
    {
      //post3
    }
  ],
  "pagination": {
    "page": "1",
    "limit": "3",
    "total": 19,
    "totalPages": 7,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Posts retrieved successfully"
}
```
<br><br>

### `POST /api/v1/posts`
- 게시글 작성(생성)

#### Request Body 예시
```json
{
  "title": "탁구 대회 후기",
  "content": "오늘 탁구 대회에서 정말 재미있게 놀았습니다...",
  "categoryId": 1,
  "type": "general",
  "imageUrls": [
    "https://example.com/image1.jpg"
  ]
}
```
- `categoryId`: 카테고리 Id
- `limit`: 게시글 개수
- `page`: 페이지 넘버

#### Response 예시
```json
{
    "success": true,
    "data": {
        "id": 20,
        "title": "탁구 대회 후기",
        "content": "오늘 탁구 대회에서 정말 재미있게 놀았습니다...",
        "type": "general",
        "isHidden": false,
        "viewCount": 0,
        "commentCount": 0,
        "createdAt": "2025-08-28T10:19:18.343Z",
        "updatedAt": "2025-08-28T10:19:18.343Z",
        "author": {
            "id": 1,
            "nickname": "샘플유저",
            "profileImageUrl": null
        },
        "likeCount": 0,
        "hateCount": 0,
        "imageUrls": []
    },
    "message": "Post created successfully"
}
```
<br><br>


### `GET /api/v1/posts/hot`
- 전체 인기글 조회
- popularityScore를 계산하여 높은 순서대로 조회
	- realtime 인기글 주기: 1시간
	- 보상 대상 인기글 주기: 24시간 기준으로 선정

#### Request Body 예시
```
http://localhost:3000/api/v1/posts/hot
```

#### Response 예시
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "title": "오늘 날씨가 좋네요",
      "content": "산책하기 좋은 날씨입니다.",
      "author": {
        "id": 1,
        "nickname": "샘플유저"
      },
      "sportCategory": {
        "id": 1,
        "name": "자유글"
      },
      "popularityScore": 0,
      "createdAt": "2025-08-25T12:48:18.450Z",
      "viewCount": 0
    },
    {
	    //post2
    },
    {
	    //post3
    }
  ],
  "message": "Hot posts retrieved successfully"
}
```
<br><br>

### `GET /api/v1/posts/hot/realtime`
- 최근 1시간 동안의 인기 게시글 조회
- popularityScore를 계산하여 순서대로 측정
	- 주기: 1시간
	- 각 카테고리별 3개 씩 조회

#### Request Body 예시
```
http://localhost:3000/api/v1/posts/hot/realtime
```


#### Response 예시
```json
{
  "success": true,
  "data": [
    {
      "categoryId": 1,
      "categoryName": "자유글",
      "posts": [
        {
          "id": 2,
          "title": "오늘 날씨가 좋네요",
          "content": "산책하기 좋은 날씨입니다.",
          "author": {
            "id": 1,
            "nickname": "샘플유저"
          },
          "sportCategory": {
            "id": 1,
            "name": "자유글"
          },
          "popularityScore": 0,
          "createdAt": "2025-08-25T12:48:18.450Z",
          "viewCount": 0
        },
        {
          //자유글2
        },
        {
          //자유글3
        }
      ]
    },
    {
      "categoryId": 2,
      "categoryName": "테니스",
      "posts": [
        {
          "id": 17,
          "title": "테니스 2:2 매칭 구합니다",
          "content": "강남구 테니스장에서 2:2 매칭 구합니다. 실력은 중급 정도이고, 즐겁게 치고 싶습니다.",
          "author": {
            "id": 1,
            "nickname": "샘플유저"
          },
          "sportCategory": {
            "id": 2,
            "name": "테니스"
          },
          "popularityScore": 0,
          "createdAt": "2025-08-25T12:48:18.524Z",
          "viewCount": 0
        },
        {
		  //테니스2
        },
        {
          //테니스3
        }
      ]
    }
  ],
  "message": "Real-time hot posts retrieved successfully"
}
```
  
<br><br>


### `GET /api/v1/posts/hot/stored`
- 24시간 기준으로 계산한 보상 대상 게시글
- popularityScore를 계산하여 순서대로 측정
	- 주기: 24시간
	- 전체 카테고리를 통틀어서 3개 선정

#### Request Body 예시
```
http://localhost:3000/api/v1/posts/hot/stored
```


#### Response 예시
```json
{
  "success": true,
  "data": [
	  {
		  "id": 2,
		  "title": "오늘 날씨가 좋네요",
		  "content": "산책하기 좋은 날씨입니다.",
		  "author": {
			"id": 1,
			"nickname": "샘플유저"
		  },
		  "sportCategory": {
			"id": 1,
			"name": "자유글"
		  },
		  "popularityScore": 0,
		  "createdAt": "2025-08-25T12:48:18.450Z",
		  "viewCount": 0
	  },
	  {
		  //post2
	  },
	  {
		  //post3
	  }
  ],
  "message": "Stored hot posts retrieved successfully"
}
```


### `GET /api/v1/posts/{post-id}`
- 게시글 단일 조회

#### Request Body 예시
```
http://localhost:3000/api/v1/posts/1
```


#### Response 예시
```json
{
    "success": true,
    "data": {
        "id": 1,
        "title": "안녕하세요!",
        "content": "처음 가입했습니다. 반갑습니다!",
        "type": "general",
        "isHidden": false,
        "viewCount": 1,
        "commentCount": 0,
        "createdAt": "2025-08-25T12:48:18.414Z",
        "updatedAt": "2025-08-25T12:48:18.414Z",
        "author": {
            "id": 1,
            "nickname": "샘플유저",
            "profileImageUrl": null
        },
        "sportCategoryId": 1,
        "sportCategoryName": "자유글",
        "comments": [],
        "isLiked": false,
        "isHated": false,
        "likeCount": 0,
        "hateCount": 0,
        "imageUrls": []
    },
    "message": "Post with details retrieved successfully"
}
```

<br>
<br>


---
Author: @dhrgodms123

© 2025 Trivus. All rights reserved.