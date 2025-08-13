"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfileResponseDto = void 0;
const user_elo_response_dto_1 = require("./user-elo-response.dto");
const user_response_dto_1 = require("./user-response.dto");
class UserProfileResponseDto {
    user;
    userElos;
    constructor(user, userElos) {
        this.user = new user_response_dto_1.UserResponseDto(user);
        this.userElos = userElos.map(elo => new user_elo_response_dto_1.UserEloResponseDto(elo));
    }
}
exports.UserProfileResponseDto = UserProfileResponseDto;
//# sourceMappingURL=user-profile-response.dto.js.map