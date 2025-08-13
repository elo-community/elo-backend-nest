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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const jwt_decode_1 = require("jwt-decode");
const auth_service_1 = require("../auth/auth.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const public_decorator_1 = require("../auth/public.decorator");
const sport_category_service_1 = require("../services/sport-category.service");
const user_service_1 = require("../services/user.service");
let AuthController = class AuthController {
    authService;
    userService;
    sportCategoryService;
    constructor(authService, userService, sportCategoryService) {
        this.authService = authService;
        this.userService = userService;
        this.sportCategoryService = sportCategoryService;
    }
    async login(loginDto) {
        try {
            const decodedToken = (0, jwt_decode_1.jwtDecode)(loginDto.idToken);
            const walletUserId = decodedToken.user_id || `user_${Date.now()}`;
            const email = decodedToken.email;
            const walletAddress = loginDto.accounts?.find(account => account.network === 'evmVERY').address;
            let user = await this.userService.findByEmail(email);
            if (!user) {
                user = await this.userService.findByWalletUserId(walletUserId);
            }
            if (decodedToken.email !== loginDto.email) {
                return {
                    success: false,
                    message: 'Login failed',
                };
            }
            if (!user) {
                const categories = await this.sportCategoryService.findAll();
                user = await this.userService.createWithDefaultElos({
                    walletUserId: walletUserId,
                    walletAddress: walletAddress,
                    email: email,
                }, categories);
            }
            return this.authService.login({
                id: user.id,
                username: user.email || user.walletUserId,
                walletAddress: user.walletAddress,
            });
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to process Google login',
                error: error.message
            };
        }
    }
    async sampleLogin(loginDto) {
        try {
            let walletAddress;
            let nickname;
            if (loginDto.userType === 'sample-user') {
                walletAddress = 'sample-user-wallet';
                nickname = '샘플유저';
            }
            else if (loginDto.userType === 'table-tennis-user') {
                walletAddress = 'table-tennis-user-wallet';
                nickname = '탁구왕민수';
            }
            else {
                return {
                    success: false,
                    message: 'Invalid user type. Use "sample-user" or "table-tennis-user"',
                };
            }
            let user = await this.userService.findByWalletAddress(walletAddress);
            if (!user) {
                return {
                    success: false,
                    message: 'Sample user not found. Please start the application first to create sample users.',
                };
            }
            const loginResponse = await this.authService.login({
                id: user.id,
                username: user.email || user.walletUserId,
                walletAddress: user.walletAddress,
            });
            return {
                success: true,
                data: {
                    user: {
                        id: user.id,
                        walletUserId: user.walletUserId,
                        walletAddress: user.walletAddress,
                        nickname: user.nickname,
                        email: user.email,
                    },
                    accessToken: loginResponse.data?.accessToken,
                },
                message: `Logged in as ${nickname}`,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to login with sample user',
                error: error.message
            };
        }
    }
    async createTestUser() {
        const testUser = {
            walletUserId: `test-user-${Date.now()}`,
            walletAddress: `0x${Date.now().toString(16)}`,
            nickname: `TestUser${Date.now()}`,
            email: `test${Date.now()}@example.com`,
        };
        const user = await this.userService.create(testUser);
        const loginResponse = await this.authService.login({
            id: user.id,
            username: user.email || user.walletUserId,
            walletAddress: user.walletAddress,
        });
        return {
            success: true,
            data: {
                user: {
                    id: user.id,
                    walletUserId: user.walletUserId,
                    walletAddress: user.walletAddress,
                    nickname: user.nickname,
                    email: user.email,
                },
                accessToken: loginResponse.data?.accessToken,
                message: 'Test user created successfully',
            },
        };
    }
    async verifyToken() {
        return {
            success: true,
            message: 'Token is valid',
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('sample-login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sampleLogin", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('test-user'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "createTestUser", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('verify'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyToken", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        user_service_1.UserService,
        sport_category_service_1.SportCategoryService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map