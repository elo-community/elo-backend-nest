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
exports.PostsController = void 0;
const common_1 = require("@nestjs/common");
const comment_response_dto_1 = require("../dtos/comment-response.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../auth/optional-jwt-auth.guard");
const public_decorator_1 = require("../auth/public.decorator");
const user_decorator_1 = require("../auth/user.decorator");
const post_detail_response_dto_1 = require("../dtos/post-detail-response.dto");
const post_response_dto_1 = require("../dtos/post-response.dto");
const post_dto_1 = require("../dtos/post.dto");
const comment_service_1 = require("../services/comment.service");
const post_service_1 = require("../services/post.service");
let PostsController = class PostsController {
    postService;
    commentService;
    constructor(postService, commentService) {
        this.postService = postService;
        this.commentService = commentService;
    }
    async findAll(query, user) {
        const paginatedPosts = await this.postService.findAll(query);
        const postsWithStatus = await Promise.all(paginatedPosts.data.map(async (post) => {
            const isLiked = user ? await this.postService.checkUserLikeStatus(post.id, user.id) : false;
            const isHated = user ? await this.postService.checkUserHateStatus(post.id, user.id) : false;
            return new post_response_dto_1.PostResponseDto(post, isLiked, isHated);
        }));
        return {
            success: true,
            data: postsWithStatus,
            pagination: paginatedPosts.pagination,
            message: 'Posts retrieved successfully'
        };
    }
    async findHot() {
        const hotPosts = await this.postService.getHotPosts();
        const formattedHotPosts = hotPosts.map(post => new post_dto_1.HotPostResponseDto(post));
        return {
            success: true,
            data: formattedHotPosts,
            message: 'Hot posts retrieved successfully'
        };
    }
    async findRealTimeHot() {
        const hotPosts = await this.postService.getRealTimeHotPosts();
        const formattedHotPosts = hotPosts.map(category => ({
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            posts: category.posts.map(post => new post_dto_1.HotPostResponseDto(post))
        }));
        return {
            success: true,
            data: formattedHotPosts,
            message: 'Real-time hot posts retrieved successfully'
        };
    }
    async findStoredHot(dateStr) {
        let targetDate;
        if (dateStr) {
            targetDate = new Date(dateStr);
            if (isNaN(targetDate.getTime())) {
                return {
                    success: false,
                    message: 'Invalid date format. Use YYYY-MM-DD'
                };
            }
        }
        const hotPosts = await this.postService.getStoredHotPosts(targetDate);
        const formattedHotPosts = hotPosts.map(post => new post_dto_1.HotPostResponseDto(post));
        return {
            success: true,
            data: formattedHotPosts,
            message: 'Stored hot posts retrieved successfully'
        };
    }
    async findOneWithDetails(id, req, user) {
        const post = await this.postService.findOneWithDetails(id);
        if (!post) {
            return {
                success: false,
                message: 'Post not found'
            };
        }
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const incremented = await this.postService.incrementViewCountIfNotViewed(id, ip);
        if (incremented) {
            post.viewCount += 1;
        }
        const isLiked = user ? await this.postService.checkUserLikeStatus(id, user.id) : false;
        const isHated = user ? await this.postService.checkUserHateStatus(id, user.id) : false;
        const likeCount = await this.postService.getPostLikeCount(id);
        const hateCount = await this.postService.getPostHateCount(id);
        return {
            success: true,
            data: new post_detail_response_dto_1.PostDetailResponseDto(post, isLiked, isHated, likeCount, hateCount, user?.id),
            message: 'Post with details retrieved successfully'
        };
    }
    async getCommentsByPost(postId, user) {
        const comments = await this.commentService.findByPostId(postId);
        return {
            success: true,
            data: comments.map((comment) => new comment_response_dto_1.CommentResponseDto(comment, user?.id)),
            message: 'Comments retrieved successfully'
        };
    }
    async create(createPostDto, user) {
        const post = await this.postService.create(createPostDto, user);
        return {
            success: true,
            data: new post_response_dto_1.PostResponseDto(post),
            message: 'Post created successfully'
        };
    }
    async update(id, updatePostDto) {
        const post = await this.postService.update(id, updatePostDto);
        if (!post) {
            return {
                success: false,
                message: 'Post not found'
            };
        }
        return {
            success: true,
            data: new post_response_dto_1.PostResponseDto(post),
            message: 'Post updated successfully'
        };
    }
    async remove(id) {
        const result = await this.postService.remove(id);
        return {
            success: true,
            data: { deleted: !!result.affected },
            message: 'Post deleted successfully'
        };
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [post_dto_1.PostQueryDto, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "findAll", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('hot'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "findHot", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('hot/realtime'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "findRealTimeHot", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('hot/stored'),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "findStoredHot", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "findOneWithDetails", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Get)(':postId/comments'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getCommentsByPost", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [post_dto_1.CreatePostDto, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, post_dto_1.UpdatePostDto]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "remove", null);
exports.PostsController = PostsController = __decorate([
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Controller)('posts'),
    __metadata("design:paramtypes", [post_service_1.PostService,
        comment_service_1.CommentService])
], PostsController);
//# sourceMappingURL=posts.controller.js.map