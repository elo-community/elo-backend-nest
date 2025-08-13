import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HotPost } from '../entities/hot-post.entity';
import { Post } from '../entities/post.entity';

@Injectable()
export class HotPostsScheduler {
    private readonly logger = new Logger(HotPostsScheduler.name);

    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(HotPost)
        private readonly hotPostRepository: Repository<HotPost>,
    ) { }

    // 매일 새벽 0시에 인기글 선정 (24시간 주기)
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async selectHotPosts() {
        this.logger.log('Starting hot posts selection for the day...');

        try {
            // 오늘 날짜의 시작과 끝 시간 계산
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // 어제 날짜의 시작 시간 (24시간 전)
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            this.logger.log(`Calculating hot posts for period: ${yesterday.toISOString()} ~ ${today.toISOString()}`);

            // 1. 모든 게시글을 기본 정보와 함께 조회 (숨겨지지 않은 것만)
            const allPosts = await this.postRepository.find({
                where: { isHidden: false },
                relations: ['author', 'sportCategory']
            });

            this.logger.log(`Found ${allPosts.length} posts to evaluate`);

            // 2. 각 게시글에 대해 인기점수 계산
            const postsWithScore: any[] = [];

            for (const post of allPosts) {
                if (!post.sportCategory) continue;

                // 좋아요 수 조회 (어제 하루 동안)
                const likeCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.likes', 'like')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('like.isLiked = :isLiked', { isLiked: true })
                    .andWhere('like.created_at >= :yesterday', { yesterday })
                    .andWhere('like.created_at < :today', { today })
                    .getCount();

                // 댓글 수 조회 (어제 하루 동안)
                const commentCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.comments', 'comment')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('comment.created_at >= :yesterday', { yesterday })
                    .andWhere('comment.created_at < :today', { today })
                    .getCount();

                // 싫어요 수 조회 (어제 하루 동안)
                const hateCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.hates', 'hate')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('hate.isHated = :isHated', { isHated: true })
                    .andWhere('hate.created_at >= :yesterday', { yesterday })
                    .andWhere('hate.created_at < :today', { today })
                    .getCount();

                // 인기점수 계산
                const popularityScore = (likeCount * 2) + (commentCount * 1) - (hateCount * 0.5);

                postsWithScore.push({
                    ...post,
                    popularityScore,
                    likeCount,
                    commentCount,
                    hateCount
                });
            }

            // 3. 전체 게시글을 인기점수 순으로 정렬하고 상위 3개 선정
            postsWithScore.sort((a, b) => b.popularityScore - a.popularityScore);
            const topPosts = postsWithScore.slice(0, 3);

            this.logger.log(`Top 3 posts selected:`);
            for (const post of topPosts) {
                this.logger.log(`- Rank ${topPosts.indexOf(post) + 1}: Post ID: ${post.id}, Title: "${post.title}", Score: ${post.popularityScore} (Likes: ${post.likeCount}, Comments: ${post.commentCount}, Hates: ${post.hateCount})`);
            }

            // 4. 기존 오늘 날짜의 인기글 삭제 (중복 방지)
            const deletedCount = await this.hotPostRepository.delete({
                selectionDate: today
            });
            this.logger.log(`Deleted ${deletedCount.affected} existing hot posts for today`);

            // 5. 선정된 인기글을 DB에 저장
            const hotPostsToSave: Partial<HotPost>[] = topPosts.map((post, index) => ({
                postId: post.id,
                popularityScore: post.popularityScore,
                rank: index + 1,
                selectionDate: today,
                isRewarded: false
            }));

            const savedHotPosts = await this.hotPostRepository.save(hotPostsToSave);
            this.logger.log(`Saved ${savedHotPosts.length} hot posts to database`);

            // TODO: 여기에 보상 지급 로직 추가
            // await this.rewardService.distributeHotPostRewards(topPosts);

            this.logger.log(`Hot posts selection and storage completed successfully for ${today.toDateString()}`);
        } catch (error) {
            this.logger.error('Failed to select hot posts', error);
        }
    }
} 