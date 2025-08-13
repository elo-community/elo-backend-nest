"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSimpleResponseDto = exports.UserResponseDto = void 0;
class UserResponseDto {
    id;
    email;
    nickname;
    walletAddress;
    profileImageUrl;
    tokenAmount;
    availableToken;
    constructor(user) {
        this.id = user.id;
        this.email = user.email;
        this.nickname = user.nickname;
        this.walletAddress = user.walletAddress;
        this.profileImageUrl = user.profileImageUrl;
        this.tokenAmount = user.tokenAmount;
        this.availableToken = user.availableToken;
    }
}
exports.UserResponseDto = UserResponseDto;
class UserSimpleResponseDto {
    id;
    nickname;
    profileImageUrl;
    constructor(user) {
        this.id = user.id;
        this.nickname = user.nickname;
        this.profileImageUrl = user.profileImageUrl;
    }
}
exports.UserSimpleResponseDto = UserSimpleResponseDto;
//# sourceMappingURL=user-response.dto.js.map