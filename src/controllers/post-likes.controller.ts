import { Controller, Get, Param, ParseIntPipe, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
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

        let postLike = await this.postLikeService.findOne(postId, user.id);
        if (postLike && postLike.isLiked) {
            postLike.isLiked = !postLike.isLiked;
            await this.postLikeService.updateLike(postLike);
        } else {
            postLike = await this.postLikeService.createLike(postId, user.id);
        }

        return {
            message: 'Like created successfully',
            data: {
                postId,
                success: true,
                isLiked: postLike.isLiked,
                likeCount: await this.postLikeService.getLikeCount(postId),
            },
        };
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