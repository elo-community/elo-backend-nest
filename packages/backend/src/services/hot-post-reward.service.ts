import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HotPostReward } from '../entities/hot-post-reward.entity';
import { HotPost } from '../entities/hot-post.entity';
import { PostLike } from '../entities/post-like.entity';
import { AccumulationStatus, AccumulationType, TokenAccumulation } from '../entities/token-accumulation.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class HotPostRewardService {
    private readonly logger = new Logger(HotPostRewardService.name);

    constructor(
        @InjectRepository(HotPost)
        private hotPostRepository: Repository<HotPost>,
        @InjectRepository(HotPostReward)
        private hotPostRewardRepository: Repository<HotPostReward>,
        @InjectRepository(PostLike)
        private postLikeRepository: Repository<PostLike>,
        @InjectRepository(TokenAccumulation)
        private tokenAccumulationRepository: Repository<TokenAccumulation>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    /**
     * 인기글로 선정된 게시글에 대해 좋아요를 누른 사용자들에게 보상 지급
     * 최초 선정 시에만 실행됨
     */
    async distributeHotPostRewards(hotPostId: number): Promise<void> {
        try {
            // 이미 보상이 지급되었는지 확인
            const hotPost = await this.hotPostRepository.findOne({
                where: { id: hotPostId },
                relations: ['post']
            });

            if (!hotPost) {
                throw new Error(`HotPost with ID ${hotPostId} not found`);
            }

            if (hotPost.isRewarded) {
                this.logger.log(`HotPost ${hotPostId} already rewarded, skipping distribution`);
                return;
            }

            // 해당 게시글에 좋아요를 누른 사용자들 조회
            const postLikes = await this.postLikeRepository.find({
                where: {
                    postId: hotPost.postId,
                    isLiked: true
                },
                relations: ['user']
            });

            if (postLikes.length === 0) {
                this.logger.log(`No likes found for post ${hotPost.postId}, no rewards to distribute`);
                return;
            }

            // 100토큰을 좋아요를 누른 사람 수로 나누기
            const totalReward = 100; // 총 보상 토큰
            const rewardPerUser = Math.floor(totalReward / postLikes.length); // 정수로 변환

            this.logger.log(`Distributing ${totalReward} tokens among ${postLikes.length} users. Reward per user: ${rewardPerUser}`);

            // 각 사용자별로 보상 정보 생성
            const rewards: Partial<HotPostReward>[] = postLikes.map(postLike => ({
                hotPostId: hotPostId,
                userId: postLike.userId,
                rewardAmount: rewardPerUser,
                isClaimed: false
            }));

            // HotPostReward 레코드들 생성
            await this.hotPostRewardRepository.save(rewards);

            // 각 사용자의 TokenAccumulation에 보상 추가
            for (const postLike of postLikes) {
                await this.addRewardToUser(postLike.userId, rewardPerUser, `hot_post_reward_${hotPostId}`);
            }

            // HotPost를 보상 지급 완료로 표시
            await this.hotPostRepository.update(hotPostId, {
                isRewarded: true,
                rewardAmount: totalReward,
                rewardedAt: new Date()
            });

            this.logger.log(`Successfully distributed ${totalReward} tokens for HotPost ${hotPostId}`);
        } catch (error) {
            this.logger.error(`Error distributing hot post rewards for ${hotPostId}:`, error);
            throw error;
        }
    }

    /**
     * 사용자의 TokenAccumulation에 보상 추가
     */
    private async addRewardToUser(userId: number, amount: number, reason: string): Promise<void> {
        try {
            // 새로운 nonce 생성 (현재 시간 기반)
            const nonce = BigInt(Date.now()).toString();

            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user?.walletAddress) {
                throw new Error(`User ${userId} not found or has no wallet address`);
            }

            const accumulation = new TokenAccumulation();
            accumulation.walletAddress = user.walletAddress;
            accumulation.reason = reason;
            accumulation.amount = BigInt(amount); // ETH 단위로 저장 (wei 변환 제거)
            accumulation.type = AccumulationType.HOT_POST_REWARD;
            accumulation.nonce = nonce;
            accumulation.status = AccumulationStatus.PENDING;

            await this.tokenAccumulationRepository.save(accumulation);
            this.logger.log(`Added ${amount} tokens to user ${userId} for reason: ${reason}`);
        } catch (error) {
            this.logger.error(`Error adding reward to user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * 사용자의 인기글 보상 현황 조회
     */
    async getUserHotPostRewards(userId: number): Promise<HotPostReward[]> {
        return await this.hotPostRewardRepository.find({
            where: { userId },
            relations: ['hotPost', 'hotPost.post'],
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * 특정 인기글의 보상 현황 조회
     */
    async getHotPostRewards(hotPostId: number): Promise<HotPostReward[]> {
        return await this.hotPostRewardRepository.find({
            where: { hotPostId },
            relations: ['user'],
            order: { createdAt: 'ASC' }
        });
    }

    /**
     * 보상 수확 처리
     */
    async claimReward(rewardId: number, txHash: string): Promise<void> {
        const reward = await this.hotPostRewardRepository.findOne({
            where: { id: rewardId }
        });

        if (!reward) {
            throw new Error(`Reward with ID ${rewardId} not found`);
        }

        if (reward.isClaimed) {
            throw new Error(`Reward ${rewardId} already claimed`);
        }

        await this.hotPostRewardRepository.update(rewardId, {
            isClaimed: true,
            claimedAt: new Date(),
            claimTxHash: txHash
        });

        this.logger.log(`Reward ${rewardId} claimed with tx hash: ${txHash}`);
    }

    /**
     * 특정 날짜의 인기글들 조회
     */
    async getHotPostsByDate(date: Date): Promise<HotPost[]> {
        return await this.hotPostRepository.find({
            where: { selectionDate: date },
            relations: ['post'],
            order: { rank: 'ASC' }
        });
    }


}
