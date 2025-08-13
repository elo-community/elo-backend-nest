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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const user_response_dto_1 = require("../dtos/user-response.dto");
const user_service_1 = require("../services/user.service");
let AuthService = class AuthService {
    jwtService;
    userService;
    constructor(jwtService, userService) {
        this.jwtService = jwtService;
        this.userService = userService;
    }
    async login(user) {
        const payload = { username: user.username, sub: user.id, walletAddress: user.walletAddress };
        const foundUser = await this.userService.findOne(user.id);
        const accessToken = this.jwtService.sign(payload);
        if (!foundUser) {
            throw new Error('User not found');
        }
        return {
            success: true,
            data: {
                accessToken: accessToken,
                user: new user_response_dto_1.UserResponseDto(foundUser)
            },
            message: 'Login successful'
        };
    }
    verifyToken(token) {
        try {
            return this.jwtService.verify(token);
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService, user_service_1.UserService])
], AuthService);
//# sourceMappingURL=auth.service.js.map