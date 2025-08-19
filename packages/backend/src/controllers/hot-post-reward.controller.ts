import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { HotPostRewardService } from '../services/hot-post-reward.service';

interface ClaimRewardDto {
    rewardId: number;
    txHash: string;
}

@Controller('hot-post-rewards')
@UseGuards(JwtAuthGuard)
export class HotPostRewardController {
    constructor(private readonly hotPostRewardService: HotPostRewardService) { }

    /**
     * 사용자의 인기글 보상 현황 조회
     */
    @Get('my-rewards')
    async getMyRewards(@CurrentUser() user: any) {
        return await this.hotPostRewardService.getUserHotPostRewards(user.id);
    }

    /**
     * 특정 인기글의 보상 현황 조회 (관리자용)
     */
    @Get(':hotPostId/rewards')
    async getHotPostRewards(@Param('hotPostId') hotPostId: number) {
        return await this.hotPostRewardService.getHotPostRewards(hotPostId);
    }

    /**
     * 보상 수확 처리
     */
    @Post('claim')
    async claimReward(@Body() claimDto: ClaimRewardDto) {
        await this.hotPostRewardService.claimReward(claimDto.rewardId, claimDto.txHash);
        return { message: 'Reward claimed successfully' };
    }
}
