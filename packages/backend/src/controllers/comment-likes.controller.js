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
exports.CommentLikesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const user_decorator_1 = require("../auth/user.decorator");
const comment_like_service_1 = require("../services/comment-like.service");
let CommentLikesController = class CommentLikesController {
    commentLikeService;
    constructor(commentLikeService) {
        this.commentLikeService = commentLikeService;
    }
    async createLike(commentId, user) {
        if (!user.walletAddress) {
            throw new common_1.UnauthorizedException('User wallet address is required');
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
    async getLikeCount(commentId) {
        const likeCount = await this.commentLikeService.getLikeCount(commentId);
        return {
            commentId,
            likeCount,
        };
    }
};
exports.CommentLikesController = CommentLikesController;
__decorate([
    (0, common_1.Post)(':commentId/likes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('commentId', common_1.ParseIntPipe)),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CommentLikesController.prototype, "createLike", null);
__decorate([
    (0, common_1.Get)(':commentId/likes'),
    __param(0, (0, common_1.Param)('commentId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CommentLikesController.prototype, "getLikeCount", null);
exports.CommentLikesController = CommentLikesController = __decorate([
    (0, common_1.Controller)('comments'),
    __metadata("design:paramtypes", [comment_like_service_1.CommentLikeService])
], CommentLikesController);
//# sourceMappingURL=comment-likes.controller.js.map