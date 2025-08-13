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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pagination_response_dto_1 = require("../dtos/pagination-response.dto");
const hot_post_entity_1 = require("../entities/hot-post.entity");
const post_entity_1 = require("../entities/post.entity");
const sport_category_entity_1 = require("../entities/sport-category.entity");
const user_entity_1 = require("../entities/user.entity");
const post_hate_service_1 = require("./post-hate.service");
const post_like_service_1 = require("./post-like.service");
const temp_image_service_1 = require("./temp-image.service");
let PostService = class PostService {
    postRepository;
    sportCategoryRepository;
    userRepository;
    hotPostRepository;
    postLikeService;
    postHateService;
    tempImageService;
    viewedPosts = new Map();
    constructor(postRepository, sportCategoryRepository, userRepository, hotPostRepository, postLikeService, postHateService, tempImageService) {
        this.postRepository = postRepository;
        this.sportCategoryRepository = sportCategoryRepository;
        this.userRepository = userRepository;
        this.hotPostRepository = hotPostRepository;
        this.postLikeService = postLikeService;
        this.postHateService = postHateService;
        this.tempImageService = tempImageService;
    }
    async findAll(query) {
        const queryBuilder = this.postRepository.createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('post.sportCategory', 'sportCategory')
            .leftJoinAndSelect('post.comments', 'comments')
            .leftJoinAndSelect('post.likes', 'likes')
            .leftJoinAndSelect('post.hates', 'hates');
        if (query?.sport) {
            queryBuilder.andWhere('post.sportCategory.id = :sportId', { sportId: query.sport });
        }
        queryBuilder.orderBy('post.createdAt', 'DESC');
        const page = query?.page || 1;
        const limit = query?.limit || 10;
        const offset = (page - 1) * limit;
        const total = await queryBuilder.getCount();
        queryBuilder.skip(offset).take(limit);
        const posts = await queryBuilder.getMany();
        return new pagination_response_dto_1.PaginationResponseDto(posts, page, limit, total);
    }
    async findOne(id) {
        return this.postRepository.findOne({ where: { id }, relations: ['author', 'sportCategory', 'comments'] });
    }
    async findOneWithDetails(id) {
        return this.postRepository.findOne({
            where: { id },
            relations: [
                'author',
                'sportCategory',
                'comments',
                'comments.user',
                'comments.replies',
                'comments.replies.user',
                'comments.likes',
                'comments.likes.user'
            ],
            order: {
                comments: {
                    createdAt: 'ASC',
                    replies: {
                        createdAt: 'ASC'
                    }
                }
            }
        });
    }
    async findByUserId(userId) {
        return this.postRepository.find({
            where: { author: { id: userId } },
            relations: ['author', 'sportCategory', 'comments', 'likes', 'hates'],
            order: { createdAt: 'DESC' }
        });
    }
    async create(createPostDto, user) {
        const { sportCategoryId, content, ...rest } = createPostDto;
        let sportCategoryEntity = undefined;
        if (typeof sportCategoryId === "number") {
            const found = await this.sportCategoryRepository.findOne({ where: { id: sportCategoryId } });
            sportCategoryEntity = found ?? undefined;
        }
        const author = await this.userRepository.findOne({ where: { id: user.id } });
        if (!author)
            throw new Error('Author not found');
        const usedImageUrls = this.extractImageUrlsFromContent(content || '');
        const post = this.postRepository.create({
            ...rest,
            content,
            sportCategory: sportCategoryEntity,
            author,
            imageUrls: usedImageUrls,
        });
        const savedPost = await this.postRepository.save(post);
        for (const imageUrl of usedImageUrls) {
            await this.tempImageService.markImageAsUsed(imageUrl, user.id);
        }
        await this.tempImageService.cleanupUnusedImages(usedImageUrls, user.id);
        return savedPost;
    }
    async update(id, updatePostDto) {
        const { sportCategoryId, content, ...rest } = updatePostDto;
        let sportCategoryEntity = undefined;
        if (typeof sportCategoryId === 'number') {
            const found = await this.sportCategoryRepository.findOne({ where: { id: sportCategoryId } });
            sportCategoryEntity = found ?? undefined;
        }
        else if (sportCategoryId && typeof sportCategoryId === 'object' && sportCategoryId.id) {
            const found = await this.sportCategoryRepository.findOne({ where: { id: sportCategoryId.id } });
            sportCategoryEntity = found ?? undefined;
        }
        if (!sportCategoryEntity) {
            const freeCategory = await this.sportCategoryRepository.findOne({ where: { name: '자유글' } });
            sportCategoryEntity = freeCategory ?? undefined;
        }
        const usedImageUrls = this.extractImageUrlsFromContent(content || '');
        await this.postRepository.update(id, {
            ...rest,
            content,
            sportCategory: sportCategoryEntity,
            imageUrls: usedImageUrls
        });
        const post = await this.findOne(id);
        if (post) {
            for (const imageUrl of usedImageUrls) {
                await this.tempImageService.markImageAsUsed(imageUrl, post.author.id);
            }
            await this.tempImageService.cleanupUnusedImages(usedImageUrls, post.author.id);
        }
        return this.findOne(id);
    }
    async remove(id) {
        return this.postRepository.delete(id);
    }
    async incrementViewCount(id) {
        await this.postRepository.increment({ id }, 'viewCount', 1);
    }
    async incrementViewCountIfNotViewed(id, ip) {
        const key = `${ip}_${id}`;
        const now = Date.now();
        const lastViewed = this.viewedPosts.get(key);
        if (!lastViewed || (now - lastViewed) > 60 * 60 * 1000) {
            await this.incrementViewCount(id);
            this.viewedPosts.set(key, now);
            this.cleanupOldRecords();
            return true;
        }
        return false;
    }
    cleanupOldRecords() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        for (const [key, timestamp] of this.viewedPosts.entries()) {
            if (now - timestamp > oneHour) {
                this.viewedPosts.delete(key);
            }
        }
    }
    async checkUserLikeStatus(postId, userId) {
        if (!userId)
            return false;
        try {
            const like = await this.postLikeService.findOne(postId, userId);
            return like?.isLiked || false;
        }
        catch (error) {
            return false;
        }
    }
    async checkUserHateStatus(postId, userId) {
        if (!userId)
            return false;
        try {
            const hate = await this.postHateService.findOne(postId, userId);
            return hate?.isHated || false;
        }
        catch (error) {
            return false;
        }
    }
    async getPostLikeCount(postId) {
        try {
            return await this.postLikeService.getLikeCount(postId);
        }
        catch (error) {
            return 0;
        }
    }
    async getPostHateCount(postId) {
        return this.postRepository
            .createQueryBuilder('post')
            .leftJoin('post.hates', 'hate')
            .where('post.id = :postId', { postId })
            .andWhere('hate.isHated = :isHated', { isHated: true })
            .getCount();
    }
    async getHotPosts() {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        try {
            const allPosts = await this.postRepository.find({
                where: { isHidden: false },
                relations: ['author', 'sportCategory']
            });
            const postsWithScore = [];
            for (const post of allPosts) {
                if (!post.sportCategory)
                    continue;
                const likeCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.likes', 'like')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('like.isLiked = :isLiked', { isLiked: true })
                    .andWhere('like.created_at >= :oneDayAgo', { oneDayAgo })
                    .getCount();
                const commentCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.comments', 'comment')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('comment.created_at >= :oneDayAgo', { oneDayAgo })
                    .getCount();
                const hateCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.hates', 'hate')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('hate.isHated = :isHated', { isHated: true })
                    .andWhere('hate.created_at >= :oneDayAgo', { oneDayAgo })
                    .getCount();
                const popularityScore = (likeCount * 2) + (commentCount * 1) - (hateCount * 0.5);
                postsWithScore.push({
                    ...post,
                    popularityScore
                });
            }
            postsWithScore.sort((a, b) => b.popularityScore - a.popularityScore);
            const topPosts = postsWithScore.slice(0, 3);
            const result = [];
            for (const post of topPosts) {
                const category = post.sportCategory;
                if (category) {
                    result.push({
                        id: post.id,
                        title: post.title,
                        content: post.content,
                        author: {
                            id: post.author.id,
                            nickname: post.author.nickname
                        },
                        sportCategory: {
                            id: category.id,
                            name: category.name
                        },
                        popularityScore: post.popularityScore,
                        createdAt: post.createdAt,
                        viewCount: post.viewCount
                    });
                }
            }
            return result;
        }
        catch (error) {
            console.error('Error in getHotPosts:', error);
            return [];
        }
    }
    async getRealTimeHotPosts() {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        try {
            const allPosts = await this.postRepository.find({
                where: { isHidden: false },
                relations: ['author', 'sportCategory']
            });
            const postsWithScore = [];
            for (const post of allPosts) {
                if (!post.sportCategory)
                    continue;
                const likeCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.likes', 'like')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('like.isLiked = :isLiked', { isLiked: true })
                    .andWhere('like.created_at >= :oneHourAgo', { oneHourAgo })
                    .getCount();
                const commentCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.comments', 'comment')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('comment.created_at >= :oneHourAgo', { oneHourAgo })
                    .getCount();
                const hateCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.hates', 'hate')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('hate.isHated = :isHated', { isHated: true })
                    .andWhere('hate.created_at >= :oneHourAgo', { oneHourAgo })
                    .getCount();
                const popularityScore = (likeCount * 2) + (commentCount * 1) - (hateCount * 0.5);
                postsWithScore.push({
                    ...post,
                    popularityScore
                });
            }
            const groupedPosts = new Map();
            postsWithScore.forEach(post => {
                const categoryId = post.sportCategory.id;
                if (!groupedPosts.has(categoryId)) {
                    groupedPosts.set(categoryId, []);
                }
                groupedPosts.get(categoryId).push(post);
            });
            for (const [categoryId, posts] of groupedPosts) {
                posts.sort((a, b) => b.popularityScore - a.popularityScore);
                groupedPosts.set(categoryId, posts.slice(0, 3));
            }
            const result = [];
            for (const [categoryId, posts] of groupedPosts) {
                const category = posts[0]?.sportCategory;
                if (category) {
                    result.push({
                        categoryId,
                        categoryName: category.name || 'Unknown',
                        posts: posts.map(post => ({
                            id: post.id,
                            title: post.title,
                            content: post.content,
                            author: {
                                id: post.author.id,
                                nickname: post.author.nickname
                            },
                            sportCategory: {
                                id: post.sportCategory.id,
                                name: post.sportCategory.name
                            },
                            popularityScore: post.popularityScore,
                            createdAt: post.createdAt,
                            viewCount: post.viewCount
                        }))
                    });
                }
            }
            return result;
        }
        catch (error) {
            console.error('Error in getRealTimeHotPosts:', error);
            return [];
        }
    }
    async getStoredHotPosts(date) {
        try {
            const targetDate = date || new Date();
            targetDate.setHours(0, 0, 0, 0);
            const hotPosts = await this.hotPostRepository.find({
                where: { selectionDate: targetDate },
                relations: ['post', 'post.author', 'post.sportCategory'],
                order: { rank: 'ASC' }
            });
            return hotPosts.map(hotPost => ({
                id: hotPost.post.id,
                title: hotPost.post.title,
                content: hotPost.post.content,
                author: {
                    id: hotPost.post.author.id,
                    nickname: hotPost.post.author.nickname
                },
                sportCategory: hotPost.post.sportCategory ? {
                    id: hotPost.post.sportCategory.id,
                    name: hotPost.post.sportCategory.name
                } : null,
                popularityScore: hotPost.popularityScore,
                rank: hotPost.rank,
                selectionDate: hotPost.selectionDate,
                createdAt: hotPost.post.createdAt,
                viewCount: hotPost.post.viewCount,
                isRewarded: hotPost.isRewarded
            }));
        }
        catch (error) {
            console.error('Error in getStoredHotPosts:', error);
            return [];
        }
    }
    extractImageUrlsFromContent(content) {
        const imageUrlRegex = /https:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp)/gi;
        const matches = content.match(imageUrlRegex);
        return matches ? [...new Set(matches)] : [];
    }
};
exports.PostService = PostService;
exports.PostService = PostService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(1, (0, typeorm_1.InjectRepository)(sport_category_entity_1.SportCategory)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(hot_post_entity_1.HotPost)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        post_like_service_1.PostLikeService,
        post_hate_service_1.PostHateService,
        temp_image_service_1.TempImageService])
], PostService);
//# sourceMappingURL=post.service.js.map