# 🚀 프론트엔드 통합 가이드 - 좋아요 토큰 시스템

## 📋 개요

이 시스템은 블록체인 기반의 좋아요 토큰 시스템입니다. 프론트엔드에서 직접 블록체인 컨트랙트를 호출하고, 백엔드는 이벤트를 감지하여 자동으로 DB를 업데이트합니다.

## 🔄 동작 흐름

### 1. 좋아요 누르기
```
프론트엔드 → 블록체인: PostLikeSystem.likePost(postId, postAuthorAddress)
블록체인: 토큰 차감 + PostLikeEvent 발생
백엔드: 이벤트 감지하여 자동 DB 업데이트
```

### 2. 좋아요 취소
```
프론트엔드 → 블록체인: PostLikeSystem.unlikePost(postId)
블록체인: 토큰 반환 + PostLikeEvent 발생
백엔드: 이벤트 감지하여 자동 DB 업데이트
```

### 3. 토큰 회수 (게시글 작성자만)
```
프론트엔드 → 블록체인: PostLikeSystem.withdrawTokens(postId)
블록체인: 수집된 토큰을 작성자에게 전송
```

## 📱 프론트엔드 구현 예시

### Web3.js를 사용한 예시

```javascript
import { ethers } from 'ethers';

class PostLikeManager {
    constructor(contractAddress, abi, signer) {
        this.contract = new ethers.Contract(contractAddress, abi, signer);
    }

    // 좋아요 누르기
    async likePost(postId, postAuthorAddress) {
        try {
            const tx = await this.contract.likePost(postId, postAuthorAddress);
            await tx.wait();
            
            console.log('좋아요 성공! 트랜잭션 해시:', tx.hash);
            return { success: true, txHash: tx.hash };
        } catch (error) {
            console.error('좋아요 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 좋아요 취소
    async unlikePost(postId) {
        try {
            const tx = await this.contract.unlikePost(postId);
            await tx.wait();
            
            console.log('좋아요 취소 성공! 트랜잭션 해시:', tx.hash);
            return { success: true, txHash: tx.hash };
        } catch (error) {
            console.error('좋아요 취소 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 토큰 회수 (게시글 작성자만)
    async withdrawTokens(postId) {
        try {
            const tx = await this.contract.withdrawTokens(postId);
            await tx.wait();
            
            console.log('토큰 회수 성공! 트랜잭션 해시:', tx.hash);
            return { success: true, txHash: tx.hash };
        } catch (error) {
            console.error('토큰 회수 실패:', error);
            return { success: false, error: error.message };
        }
    }

    // 게시글 좋아요 정보 조회
    async getPostLikeInfo(postId) {
        try {
            const [totalLikes, totalTokens] = await this.contract.getPostLikeInfo(postId);
            return {
                totalLikes: totalLikes.toString(),
                totalTokens: ethers.formatEther(totalTokens)
            };
        } catch (error) {
            console.error('좋아요 정보 조회 실패:', error);
            return null;
        }
    }

    // 사용자 좋아요 여부 확인
    async getUserLikeInfo(postId, userAddress) {
        try {
            const [hasLiked, timestamp] = await this.contract.getUserLikeInfo(postId, userAddress);
            return {
                hasLiked,
                timestamp: timestamp.toString()
            };
        } catch (error) {
            console.error('사용자 좋아요 정보 조회 실패:', error);
            return null;
        }
    }
}
```

### React Hook 예시

```javascript
import { useState, useEffect } from 'react';
import { useContract, useProvider, useSigner } from 'wagmi';

export function usePostLike(postId, postAuthorAddress) {
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const { data: signer } = useSigner();
    const provider = useProvider();

    // 좋아요 상태 조회
    const fetchLikeStatus = async () => {
        try {
            const response = await fetch(`/api/posts/${postId}/likes/status`);
            const data = await response.json();
            
            setIsLiked(data.isLiked);
            setLikeCount(data.likeCount);
        } catch (err) {
            console.error('좋아요 상태 조회 실패:', err);
        }
    };

    // 좋아요 개수 조회
    const fetchLikeCount = async () => {
        try {
            const response = await fetch(`/api/posts/${postId}/likes`);
            const data = await response.json();
            setLikeCount(data.likeCount);
        } catch (err) {
            console.error('좋아요 개수 조회 실패:', err);
        }
    };

    // 좋아요 토글
    const toggleLike = async () => {
        if (!signer) {
            setError('지갑 연결이 필요합니다');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (isLiked) {
                // 좋아요 취소
                await unlikePost(postId);
            } else {
                // 좋아요 누르기
                await likePost(postId, postAuthorAddress);
            }

            // 상태 업데이트
            await fetchLikeStatus();
            await fetchLikeCount();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLikeStatus();
        fetchLikeCount();
    }, [postId]);

    return {
        isLiked,
        likeCount,
        isLoading,
        error,
        toggleLike,
        refresh: () => {
            fetchLikeStatus();
            fetchLikeCount();
        }
    };
}
```

## 🔌 백엔드 API

### 1. 좋아요 개수 조회
```
GET /posts/:postId/likes
Response: { postId: number, likeCount: number }
```

### 2. 사용자 좋아요 상태 조회
```
GET /posts/:postId/likes/status
Headers: Authorization: Bearer <JWT_TOKEN>
Response: {
    postId: number,
    isLiked: boolean,
    likeCount: number,
    tokenDeducted: boolean,
    transactionHash?: string,
    tokenDeductedAt?: Date,
    message: string
}
```

### 3. 게시글 토큰 정보 조회
```
GET /posts/:postId/likes/tokens
Headers: Authorization: Bearer <JWT_TOKEN>
Response: {
    postId: number,
    totalLikes: number,
    totalTokensCollected: number,
    canWithdraw: boolean,
    message: string
}
```

## ⚠️ 주의사항

1. **토큰 승인**: 좋아요를 누르기 전에 `approve()` 함수로 컨트랙트에 토큰 사용 권한을 부여해야 합니다.

2. **가스비**: 모든 블록체인 트랜잭션에는 가스비가 발생합니다.

3. **네트워크 확인**: 올바른 네트워크(Polygon Amoy)에 연결되어 있는지 확인하세요.

4. **에러 처리**: 사용자에게 적절한 에러 메시지를 표시하세요.

## 🎯 다음 단계

1. 컨트랙트 배포 및 주소 설정
2. 프론트엔드에서 Web3 연결 설정
3. 좋아요 UI 컴포넌트 구현
4. 실시간 상태 업데이트 (WebSocket 또는 폴링)
5. 에러 처리 및 사용자 피드백 구현

## 📞 지원

문제가 발생하면 백엔드 로그를 확인하여 이벤트 처리 상태를 점검하세요.
