import { Controller, Get, Param, ParseIntPipe, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtUser } from 'src/auth/jwt-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { PostHateService } from '../services/post-hate.service';

interface HateCountResponseDto {
    postId: number;
    hateCount: number;
}

@Controller('posts')
export class PostHatesController {
    constructor(private readonly postHateService: PostHateService) { }

    @Post(':postId/hates')
    @UseGuards(JwtAuthGuard)
    async createHate(
        @Param('postId', ParseIntPipe) postId: number,
        @CurrentUser() user: JwtUser,
    ) {
        if (!user.walletAddress) {
            throw new UnauthorizedException('User wallet address is required');
        }

        let postHate = await this.postHateService.findOne(postId, user.id);
        if (postHate && postHate.isHated) {
            postHate.isHated = !postHate.isHated;
            await this.postHateService.updateHate(postHate);
        } else {
            postHate = await this.postHateService.createHate(postId, user.id);
        }

        return {
            message: 'Hate created successfully',
            data: {
                postId,
                success: true,
                isHated: postHate.isHated,
                hateCount: await this.postHateService.getHateCount(postId),
            },
        };
    }

    @Get(':postId/hates')
    async getHateCount(@Param('postId', ParseIntPipe) postId: number): Promise<HateCountResponseDto> {
        const hateCount = await this.postHateService.getHateCount(postId);
        return {
            postId,
            hateCount,
        };
    }
} 