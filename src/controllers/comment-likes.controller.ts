import { Controller, Get, Param, ParseIntPipe, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtUser } from 'src/auth/jwt-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { CommentLikeService } from '../services/comment-like.service';

interface LikeCountResponseDto {
    commentId: number;
    likeCount: number;
}

@Controller('comments')
export class CommentLikesController {
    constructor(private readonly commentLikeService: CommentLikeService) { }

    @Post(':commentId/likes')
    @UseGuards(JwtAuthGuard)
    async createLike(
        @Param('commentId', ParseIntPipe) commentId: number,
        @CurrentUser() user: JwtUser,
    ) {
        if (!user.walletAddress) {
            throw new UnauthorizedException('User wallet address is required');
        }

        const commentLike = await this.commentLikeService.createLike(commentId, user.id);

        return {
            message: 'Like toggled successfully',
            data: {
                commentId,
                success: true,
                isLiked: commentLike.isLiked,
                likeCount: await this.commentLikeService.getLikeCount(commentId),
            },
        };
    }

    @Get(':commentId/likes')
    async getLikeCount(@Param('commentId', ParseIntPipe) commentId: number): Promise<LikeCountResponseDto> {
        const likeCount = await this.commentLikeService.getLikeCount(commentId);
        return {
            commentId,
            likeCount,
        };
    }
} 