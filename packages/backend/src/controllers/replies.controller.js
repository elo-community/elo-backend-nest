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
exports.RepliesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const user_decorator_1 = require("../auth/user.decorator");
const reply_response_dto_1 = require("../dtos/reply-response.dto");
const reply_dto_1 = require("../dtos/reply.dto");
const reply_service_1 = require("../services/reply.service");
let RepliesController = class RepliesController {
    replyService;
    constructor(replyService) {
        this.replyService = replyService;
    }
    async findAll(query) {
        const replies = await this.replyService.findAll(query);
        return {
            success: true,
            data: replies.map((reply) => new reply_response_dto_1.ReplyResponseDto(reply)),
            message: 'Replies retrieved successfully'
        };
    }
    async findOne(id) {
        const reply = await this.replyService.findOne(id);
        return {
            success: true,
            data: new reply_response_dto_1.ReplyResponseDto(reply),
            message: 'Reply retrieved successfully'
        };
    }
    async create(createReplyDto, user) {
        const reply = await this.replyService.create(createReplyDto, user);
        return {
            success: true,
            data: new reply_response_dto_1.ReplyResponseDto(reply),
            message: 'Reply created successfully'
        };
    }
    async update(id, updateReplyDto, user) {
        const reply = await this.replyService.update(id, updateReplyDto, user);
        return {
            success: true,
            data: new reply_response_dto_1.ReplyResponseDto(reply),
            message: 'Reply updated successfully'
        };
    }
    async remove(id, user) {
        const result = await this.replyService.remove(id, user);
        return {
            success: true,
            data: { deleted: !!result.affected },
            message: 'Reply deleted successfully'
        };
    }
    async findByCommentId(commentId) {
        const replies = await this.replyService.findByCommentId(commentId);
        return {
            success: true,
            data: replies.map((reply) => new reply_response_dto_1.ReplyResponseDto(reply)),
            message: 'Replies for comment retrieved successfully'
        };
    }
};
exports.RepliesController = RepliesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reply_dto_1.ReplyQueryDto]),
    __metadata("design:returntype", Promise)
], RepliesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RepliesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reply_dto_1.CreateReplyDto, Object]),
    __metadata("design:returntype", Promise)
], RepliesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, reply_dto_1.UpdateReplyDto, Object]),
    __metadata("design:returntype", Promise)
], RepliesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], RepliesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('comment/:commentId'),
    __param(0, (0, common_1.Param)('commentId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RepliesController.prototype, "findByCommentId", null);
exports.RepliesController = RepliesController = __decorate([
    (0, common_1.Controller)('replies'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [reply_service_1.ReplyService])
], RepliesController);
//# sourceMappingURL=replies.controller.js.map