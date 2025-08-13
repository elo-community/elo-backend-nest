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
exports.PostHatesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const user_decorator_1 = require("../auth/user.decorator");
const post_hate_service_1 = require("../services/post-hate.service");
let PostHatesController = class PostHatesController {
    postHateService;
    constructor(postHateService) {
        this.postHateService = postHateService;
    }
    async createHate(postId, user) {
        if (!user.walletAddress) {
            throw new common_1.UnauthorizedException('User wallet address is required');
        }
        let postHate = await this.postHateService.findOne(postId, user.id);
        if (postHate && postHate.isHated) {
            postHate.isHated = !postHate.isHated;
            await this.postHateService.updateHate(postHate);
        }
        else {
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
    async getHateCount(postId) {
        const hateCount = await this.postHateService.getHateCount(postId);
        return {
            postId,
            hateCount,
        };
    }
};
exports.PostHatesController = PostHatesController;
__decorate([
    (0, common_1.Post)(':postId/hates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('postId', common_1.ParseIntPipe)),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostHatesController.prototype, "createHate", null);
__decorate([
    (0, common_1.Get)(':postId/hates'),
    __param(0, (0, common_1.Param)('postId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostHatesController.prototype, "getHateCount", null);
exports.PostHatesController = PostHatesController = __decorate([
    (0, common_1.Controller)('posts'),
    __metadata("design:paramtypes", [post_hate_service_1.PostHateService])
], PostHatesController);
//# sourceMappingURL=post-hates.controller.js.map