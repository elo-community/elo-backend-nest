"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchResultHistoryQueryDto = exports.MatchResultHistoryItemDto = exports.MatchResultHistoryResponseDto = void 0;
class MatchResultHistoryResponseDto {
    matches;
}
exports.MatchResultHistoryResponseDto = MatchResultHistoryResponseDto;
class MatchResultHistoryItemDto {
    id;
    partner;
    partner_nickname;
    sportCategory;
    result;
    isHandicap;
    created_at;
    elo_before;
    elo_after;
    elo_delta;
}
exports.MatchResultHistoryItemDto = MatchResultHistoryItemDto;
class MatchResultHistoryQueryDto {
    sport;
    partner;
    page;
    limit;
}
exports.MatchResultHistoryQueryDto = MatchResultHistoryQueryDto;
//# sourceMappingURL=match-result-history.dto.js.map