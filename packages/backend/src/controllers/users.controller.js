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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../auth/public.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const user_decorator_1 = require("../auth/user.decorator");
const match_result_history_dto_1 = require("../dtos/match-result-history.dto");
const post_response_dto_1 = require("../dtos/post-response.dto");
const user_profile_response_dto_1 = require("../dtos/user-profile-response.dto");
const user_response_dto_1 = require("../dtos/user-response.dto");
const user_dto_1 = require("../dtos/user.dto");
const match_result_service_1 = require("../services/match-result.service");
const post_service_1 = require("../services/post.service");
const sport_category_service_1 = require("../services/sport-category.service");
const user_service_1 = require("../services/user.service");
let UsersController = class UsersController {
    userService;
    sportCategoryService;
    postService;
    matchResultService;
    constructor(userService, sportCategoryService, postService, matchResultService) {
        this.userService = userService;
        this.sportCategoryService = sportCategoryService;
        this.postService = postService;
        this.matchResultService = matchResultService;
    }
    async findAll() {
        const users = await this.userService.findAll();
        return {
            success: true,
            data: users.map((user) => new user_response_dto_1.UserResponseDto(user)),
            message: 'Users retrieved successfully'
        };
    }
    async getMe(currentUser) {
        const user = await this.userService.findOne(currentUser.id);
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        return {
            success: true,
            data: new user_response_dto_1.UserResponseDto(user),
            message: 'Current user profile retrieved successfully'
        };
    }
    async findOne(id) {
        const user = await this.userService.findOne(id);
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        return {
            success: true,
            data: new user_response_dto_1.UserResponseDto(user),
            message: 'User retrieved successfully'
        };
    }
    async getMyProfile(user) {
        const userId = user?.id;
        if (!userId) {
            throw new common_1.UnauthorizedException('User not authenticated');
        }
        const profileData = await this.userService.findProfileWithElos(userId);
        return new user_profile_response_dto_1.UserProfileResponseDto(profileData.user, profileData.userElos);
    }
    async getProfile(id) {
        const userId = parseInt(id);
        if (!userId) {
            throw new common_1.UnauthorizedException('User not authenticated');
        }
        const profileData = await this.userService.findProfileWithElos(userId);
        return new user_profile_response_dto_1.UserProfileResponseDto(profileData.user, profileData.userElos);
    }
    async getUserPosts(id, currentUser) {
        const userId = id === 'me' ? currentUser.id : parseInt(id);
        if (!userId) {
            return {
                success: false,
                message: 'Invalid user ID'
            };
        }
        const user = await this.userService.findOne(userId);
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        const posts = await this.postService.findByUserId(userId);
        const postsWithStatus = await Promise.all(posts.map(async (post) => {
            const isLiked = await this.postService.checkUserLikeStatus(post.id, currentUser.id);
            const isHated = await this.postService.checkUserHateStatus(post.id, currentUser.id);
            return new post_response_dto_1.PostResponseDto(post, isLiked, isHated);
        }));
        return {
            success: true,
            data: postsWithStatus,
            message: 'User posts retrieved successfully'
        };
    }
    async create(createUserDto) {
        const categories = await this.sportCategoryService.findAll();
        const user = await this.userService.createWithDefaultElos({
            ...createUserDto,
            nickname: createUserDto.nickname || `user${Date.now()}`,
        }, categories);
        return {
            success: true,
            data: new user_response_dto_1.UserResponseDto(user),
            message: 'User created successfully'
        };
    }
    async updateNickname(createUserDto, currentUser) {
        const user = await this.userService.findById(currentUser.id);
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        user.nickname = createUserDto.nickname;
        await this.userService.update(currentUser.id, user);
        return {
            success: true,
            data: new user_response_dto_1.UserResponseDto(user),
            message: 'User created successfully'
        };
    }
    async update(id, updateUserDto) {
        const user = await this.userService.update(id, updateUserDto);
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        return {
            success: true,
            data: new user_response_dto_1.UserResponseDto(user),
            message: 'User updated successfully'
        };
    }
    async getMyMatchHistory(query, currentUser) {
        const matchHistory = await this.matchResultService.findUserMatchHistory(currentUser, query);
        return {
            success: true,
            data: {
                matches: matchHistory.data
            },
            pagination: matchHistory.pagination,
            message: 'Match history retrieved successfully'
        };
    }
    async remove(id) {
        const result = await this.userService.remove(id);
        return {
            success: true,
            data: { deleted: !!result.affected },
            message: 'User deleted successfully'
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('me/profile'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyProfile", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/profile'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(':id/posts'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserPosts", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)('me/nickname'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateNickname", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Get)('me/match-results'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [match_result_history_dto_1.MatchResultHistoryQueryDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyMatchHistory", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [user_service_1.UserService,
        sport_category_service_1.SportCategoryService,
        post_service_1.PostService,
        match_result_service_1.MatchResultService])
], UsersController);
//# sourceMappingURL=users.controller.js.map