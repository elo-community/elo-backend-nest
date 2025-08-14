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
exports.CommentsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../auth/optional-jwt-auth.guard");
const public_decorator_1 = require("../auth/public.decorator");
const user_decorator_1 = require("../auth/user.decorator");
const comment_response_dto_1 = require("../dtos/comment-response.dto");
const comment_dto_1 = require("../dtos/comment.dto");
const comment_service_1 = require("../services/comment.service");
let CommentsController = class CommentsController {
    commentService;
    constructor(commentService) {
        this.commentService = commentService;
    }
    async findAll(query, user) {
        const comments = await this.commentService.findAll(query);
        return {
            success: true,
            data: comments.map(comment => new comment_response_dto_1.CommentResponseDto(comment, user.id)),
            message: 'Comments retrieved successfully'
        };
    }
    async findOne(id, user) {
        const { comment } = await this.commentService.findOne(id);
        return {
            success: true,
            data: new comment_response_dto_1.CommentResponseDto(comment, user.id),
            message: 'Comment retrieved successfully'
        };
    }
    async create(createCommentDto, user) {
        const { comment } = await this.commentService.create(createCommentDto, user);
        return {
            success: true,
            data: new comment_response_dto_1.CommentResponseDto(comment, user.id),
            message: 'Comment created successfully'
        };
    }
    async update(id, updateCommentDto, user) {
        const { comment } = await this.commentService.update(id, updateCommentDto, user);
        return {
            success: true,
            data: new comment_response_dto_1.CommentResponseDto(comment, user.id),
            message: 'Comment updated successfully'
        };
    }
    async remove(id, user) {
        const result = await this.commentService.remove(id, user);
        return {
            success: true,
            data: { deleted: !!result.affected },
            message: 'Comment deleted successfully'
        };
    }
    async getCommentTree(postId, user) {
        const comments = await this.commentService.getCommentTree(Number(postId));
        return {
            success: true,
            data: comments.map(comment => new comment_response_dto_1.CommentResponseDto(comment, user?.id)),
            message: 'Comment tree retrieved successfully'
        };
    }
};
exports.CommentsController = CommentsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [comment_dto_1.CommentQueryDto, Object]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [comment_dto_1.CreateCommentDto, Object]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, comment_dto_1.UpdateCommentDto, Object]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "remove", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, common_1.Get)('post/:postId/tree'),
    __param(0, (0, common_1.Param)('postId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CommentsController.prototype, "getCommentTree", null);
exports.CommentsController = CommentsController = __decorate([
    (0, common_1.Controller)('comments'),
    __metadata("design:paramtypes", [comment_service_1.CommentService])
], CommentsController);
//# sourceMappingURL=comments.controller.js.map