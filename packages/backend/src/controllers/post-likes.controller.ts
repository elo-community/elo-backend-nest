import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtUser } from 'src/auth/jwt-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { PostLikeService } from '../services/post-like.service';
import { PostService } from '../services/post.service';

interface LikeCountResponseDto {
    postId: number;
    likeCount: number;
}

interface LikeStatusResponseDto {
    postId: number;
    isLiked: boolean;
    likeCount: number;
    tokenDeducted: boolean;
    transactionHash?: string;
    tokenDeductedAt?: Date;
    message: string;
}

@Controller('posts')
export class PostLikesController {
    constructor(
        private readonly postLikeService: PostLikeService,
        private readonly postService: PostService,
    ) { }

    /**
     * 게시글의 좋아요 개수 조회 (인증 불필요)
     */
    @Get(':postId/likes')
    async getLikeCount(@Param('postId', ParseIntPipe) postId: number): Promise<LikeCountResponseDto> {
        const likeCount = await this.postLikeService.getLikeCount(postId);
        return {
            postId,
            likeCount,
        };
    }

    /**
     * 사용자의 게시글 좋아요 상태 조회 (인증 필요)
     */
    @Get(':postId/likes/status')
    @UseGuards(JwtAuthGuard)
    async getLikeStatus(
        @Param('postId', ParseIntPipe) postId: number,
        @CurrentUser() user: JwtUser,
    ): Promise<LikeStatusResponseDto> {
        const likeInfo = await this.postLikeService.getLikeWithTransactionInfo(postId, user.id);
        const likeCount = await this.postLikeService.getLikeCount(postId);

        let message = 'Not liked';
        if (likeInfo?.isLiked === true) {
            if (likeInfo.tokenDeducted) {
                message = 'Post liked with tokens deducted';
            } else {
                message = 'Post liked but tokens not yet deducted. Please wait for blockchain confirmation.';
            }
        }

        return {
            postId,
            isLiked: likeInfo?.isLiked || false,
            likeCount,
            tokenDeducted: likeInfo?.tokenDeducted || false,
            transactionHash: likeInfo?.transactionHash,
            tokenDeductedAt: likeInfo?.tokenDeductedAt,
            message,
        };
    }

    /**
     * 게시글 작성자의 수집된 토큰 정보 조회 (인증 필요)
     */
    @Get(':postId/likes/tokens')
    @UseGuards(JwtAuthGuard)
    async getPostTokenInfo(
        @Param('postId', ParseIntPipe) postId: number,
        @CurrentUser() user: JwtUser,
    ): Promise<{
        postId: number;
        totalLikes: number;
        totalTokensCollected: number;
        canWithdraw: boolean;
        message: string;
    }> {
        const likeCount = await this.postLikeService.getLikeCount(postId);
        const post = await this.postService.findOne(postId);

        if (!post) {
            throw new Error('Post not found');
        }

        // 게시글 작성자인지 확인
        const isAuthor = post.author.id === user.id;
        const totalTokensCollected = likeCount; // 좋아요 1개당 토큰 1개

        return {
            postId,
            totalLikes: likeCount,
            totalTokensCollected,
            canWithdraw: isAuthor && totalTokensCollected > 0,
            message: isAuthor
                ? `You can withdraw ${totalTokensCollected} tokens from this post`
                : 'Only the post author can withdraw tokens',
        };
    }
} 