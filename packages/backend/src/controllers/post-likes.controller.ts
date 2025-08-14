import { Controller, Get, NotFoundException, Param, ParseIntPipe, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtUser } from 'src/auth/jwt-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { PostLikeService } from '../services/post-like.service';

interface LikeCountResponseDto {
    postId: number;
    likeCount: number;
}

@Controller('posts')
export class PostLikesController {
    constructor(private readonly postLikeService: PostLikeService) { }

    @Post(':postId/likes')
    @UseGuards(JwtAuthGuard)
    async createLike(
        @Param('postId', ParseIntPipe) postId: number,
        @CurrentUser() user: JwtUser,
    ) {
        if (!user.walletAddress) {
            throw new UnauthorizedException('User wallet address is required');
        }

        try {
            const postLike = await this.postLikeService.createLike(postId, user.id);

            return {
                message: 'Like toggled successfully',
                data: {
                    postId,
                    success: true,
                    isLiked: postLike.isLiked,
                    likeCount: await this.postLikeService.getLikeCount(postId),
                },
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException('Post not found');
            } else {
                throw error;
            }
        }
    }

    @Get(':postId/likes')
    async getLikeCount(@Param('postId', ParseIntPipe) postId: number): Promise<LikeCountResponseDto> {
        const likeCount = await this.postLikeService.getLikeCount(postId);
        return {
            postId,
            likeCount,
        };
    }
} 