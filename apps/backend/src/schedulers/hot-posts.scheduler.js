"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var HotPostsScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotPostsScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const hot_post_entity_1 = require("../entities/hot-post.entity");
const post_entity_1 = require("../entities/post.entity");
let HotPostsScheduler = HotPostsScheduler_1 = class HotPostsScheduler {
    postRepository;
    hotPostRepository;
    logger = new common_1.Logger(HotPostsScheduler_1.name);
    constructor(postRepository, hotPostRepository) {
        this.postRepository = postRepository;
        this.hotPostRepository = hotPostRepository;
    }
    async selectHotPosts() {
        this.logger.log('Starting hot posts selection for the day...');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            this.logger.log(`Calculating hot posts for period: ${yesterday.toISOString()} ~ ${today.toISOString()}`);
            const allPosts = await this.postRepository.find({
                where: { isHidden: false },
                relations: ['author', 'sportCategory']
            });
            this.logger.log(`Found ${allPosts.length} posts to evaluate`);
            const postsWithScore = [];
            for (const post of allPosts) {
                if (!post.sportCategory)
                    continue;
                const likeCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.likes', 'like')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('like.isLiked = :isLiked', { isLiked: true })
                    .andWhere('like.created_at >= :yesterday', { yesterday })
                    .andWhere('like.created_at < :today', { today })
                    .getCount();
                const commentCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.comments', 'comment')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('comment.created_at >= :yesterday', { yesterday })
                    .andWhere('comment.created_at < :today', { today })
                    .getCount();
                const hateCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.hates', 'hate')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('hate.isHated = :isHated', { isHated: true })
                    .andWhere('hate.created_at >= :yesterday', { yesterday })
                    .andWhere('hate.created_at < :today', { today })
                    .getCount();
                const popularityScore = (likeCount * 2) + (commentCount * 1) - (hateCount * 0.5);
                postsWithScore.push({
                    ...post,
                    popularityScore,
                    likeCount,
                    commentCount,
                    hateCount
                });
            }
            postsWithScore.sort((a, b) => b.popularityScore - a.popularityScore);
            const topPosts = postsWithScore.slice(0, 3);
            this.logger.log(`Top 3 posts selected:`);
            for (const post of topPosts) {
                this.logger.log(`- Rank ${topPosts.indexOf(post) + 1}: Post ID: ${post.id}, Title: "${post.title}", Score: ${post.popularityScore} (Likes: ${post.likeCount}, Comments: ${post.commentCount}, Hates: ${post.hateCount})`);
            }
            const deletedCount = await this.hotPostRepository.delete({
                selectionDate: today
            });
            this.logger.log(`Deleted ${deletedCount.affected} existing hot posts for today`);
            const hotPostsToSave = topPosts.map((post, index) => ({
                postId: post.id,
                popularityScore: post.popularityScore,
                rank: index + 1,
                selectionDate: today,
                isRewarded: false
            }));
            const savedHotPosts = await this.hotPostRepository.save(hotPostsToSave);
            this.logger.log(`Saved ${savedHotPosts.length} hot posts to database`);
            this.logger.log(`Hot posts selection and storage completed successfully for ${today.toDateString()}`);
        }
        catch (error) {
            this.logger.error('Failed to select hot posts', error);
        }
    }
};
exports.HotPostsScheduler = HotPostsScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HotPostsScheduler.prototype, "selectHotPosts", null);
exports.HotPostsScheduler = HotPostsScheduler = HotPostsScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(1, (0, typeorm_1.InjectRepository)(hot_post_entity_1.HotPost)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], HotPostsScheduler);
//# sourceMappingURL=hot-posts.scheduler.js.map