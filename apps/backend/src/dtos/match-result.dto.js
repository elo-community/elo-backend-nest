"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchResultResponseDto = exports.UpdateMatchResultDto = exports.CreateMatchResultDto = void 0;
class CreateMatchResultDto {
    partnerNickname;
    sportCategoryId;
    senderResult;
    isHandicap;
    playedAt;
}
exports.CreateMatchResultDto = CreateMatchResultDto;
class UpdateMatchResultDto {
    action;
}
exports.UpdateMatchResultDto = UpdateMatchResultDto;
class MatchResultResponseDto {
    id;
    partnerId;
    partnerNickname;
    senderId;
    senderNickname;
    sportCategoryId;
    sportCategoryName;
    senderResult;
    isHandicap;
    status;
    expiredTime;
    createdAt;
    playedAt;
    playedDate;
    confirmedAt;
    partnerResult;
    constructor(matchResult) {
        this.id = matchResult.id;
        this.sportCategoryId = matchResult.sportCategory.id;
        this.sportCategoryName = matchResult.sportCategory.name;
        this.senderId = matchResult.user?.id;
        this.senderNickname = matchResult.user?.nickname;
        this.partnerId = matchResult.partner?.id;
        this.partnerNickname = matchResult.partner?.nickname;
        this.senderResult = matchResult.senderResult;
        this.partnerResult = matchResult.partnerResult;
        this.isHandicap = matchResult.isHandicap;
        this.status = matchResult.status;
        this.expiredTime = matchResult.expiredTime;
        this.createdAt = matchResult.createdAt;
        this.playedAt = matchResult.playedAt;
        this.playedDate = matchResult.playedDate;
        this.confirmedAt = matchResult.confirmedAt;
    }
}
exports.MatchResultResponseDto = MatchResultResponseDto;
//# sourceMappingURL=match-result.dto.js.map