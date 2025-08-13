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
exports.UserMatchesController = exports.MatchResultsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const user_decorator_1 = require("../auth/user.decorator");
const create_match_result_dto_1 = require("../dtos/create-match-result.dto");
const match_result_dto_1 = require("../dtos/match-result.dto");
const respond_match_result_dto_1 = require("../dtos/respond-match-result.dto");
const match_result_service_1 = require("../services/match-result.service");
let MatchResultsController = class MatchResultsController {
    matchResultService;
    constructor(matchResultService) {
        this.matchResultService = matchResultService;
    }
    async create(createMatchResultDto, user) {
        const matchResult = await this.matchResultService.create(createMatchResultDto, user);
        return {
            success: true,
            data: new match_result_dto_1.MatchResultResponseDto(matchResult),
            message: 'Match request created successfully'
        };
    }
    async findSentRequests(user) {
        const matchResults = await this.matchResultService.findSentRequests(user);
        return {
            success: true,
            data: matchResults.map(matchResult => new match_result_dto_1.MatchResultResponseDto(matchResult)),
            message: 'Sent match requests retrieved successfully'
        };
    }
    async findReceivedRequests(user) {
        const matchResults = await this.matchResultService.findReceivedRequests(user);
        return {
            success: true,
            data: matchResults.map(matchResult => new match_result_dto_1.MatchResultResponseDto(matchResult)),
            message: 'Received match requests retrieved successfully'
        };
    }
    async findOne(id, user) {
        const matchResult = await this.matchResultService.findOne(id);
        if (!matchResult) {
            return {
                success: false,
                message: 'Match result not found'
            };
        }
        if (matchResult.user?.id !== user.id && matchResult.partner?.id !== user.id) {
            return {
                success: false,
                message: 'You do not have permission to view this match result'
            };
        }
        return {
            success: true,
            data: new match_result_dto_1.MatchResultResponseDto(matchResult),
            message: 'Match result retrieved successfully'
        };
    }
    async respond(id, respondDto, user) {
        const matchResult = await this.matchResultService.respond(id, respondDto, user);
        return {
            success: true,
            data: new match_result_dto_1.MatchResultResponseDto(matchResult),
            message: `Match request ${respondDto.action}ed successfully`
        };
    }
};
exports.MatchResultsController = MatchResultsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_match_result_dto_1.CreateMatchResultDto, Object]),
    __metadata("design:returntype", Promise)
], MatchResultsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('sent'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MatchResultsController.prototype, "findSentRequests", null);
__decorate([
    (0, common_1.Get)('received'),
    __param(0, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MatchResultsController.prototype, "findReceivedRequests", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], MatchResultsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/respond'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, respond_match_result_dto_1.RespondMatchResultDto, Object]),
    __metadata("design:returntype", Promise)
], MatchResultsController.prototype, "respond", null);
exports.MatchResultsController = MatchResultsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('match-results'),
    __metadata("design:paramtypes", [match_result_service_1.MatchResultService])
], MatchResultsController);
let UserMatchesController = class UserMatchesController {
    matchResultService;
    constructor(matchResultService) {
        this.matchResultService = matchResultService;
    }
    async findUserMatches(userId, user) {
        const targetUserId = userId === 'me' ? user.id : parseInt(userId);
        const matchResults = await this.matchResultService.findByUserId(targetUserId);
        return {
            success: true,
            data: matchResults.map(matchResult => new match_result_dto_1.MatchResultResponseDto(matchResult)),
            message: 'User matches retrieved successfully'
        };
    }
};
exports.UserMatchesController = UserMatchesController;
__decorate([
    (0, common_1.Get)(':userId/matches'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserMatchesController.prototype, "findUserMatches", null);
exports.UserMatchesController = UserMatchesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [match_result_service_1.MatchResultService])
], UserMatchesController);
//# sourceMappingURL=match-results.controller.js.map