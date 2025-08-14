"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEloResponseDto = void 0;
class UserEloResponseDto {
    id;
    sportCategory;
    eloPoint;
    tier;
    percentile;
    constructor(userElo) {
        this.id = userElo.id;
        this.sportCategory = {
            id: userElo.sportCategory.id,
            name: userElo.sportCategory.name
        };
        this.eloPoint = userElo.eloPoint;
        this.tier = userElo.tier;
        this.percentile = userElo.percentile;
    }
}
exports.UserEloResponseDto = UserEloResponseDto;
//# sourceMappingURL=user-elo-response.dto.js.map