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
exports.MatchResult = exports.MatchStatus = void 0;
const typeorm_1 = require("typeorm");
const sport_category_entity_1 = require("./sport-category.entity");
const user_entity_1 = require("./user.entity");
var MatchStatus;
(function (MatchStatus) {
    MatchStatus["PENDING"] = "pending";
    MatchStatus["ACCEPTED"] = "accepted";
    MatchStatus["REJECTED"] = "rejected";
    MatchStatus["EXPIRED"] = "expired";
    MatchStatus["CANCELLED"] = "cancelled";
})(MatchStatus || (exports.MatchStatus = MatchStatus = {}));
let MatchResult = class MatchResult {
    id;
    user;
    partner;
    sportCategory;
    senderResult;
    isHandicap;
    status;
    expiredTime;
    createdAt;
    playedAt;
    playedDate;
    confirmedAt;
    partnerResult;
    pairUserLo;
    pairUserHi;
    eloBefore;
    eloAfter;
    eloDelta;
    partnerEloBefore;
    partnerEloAfter;
    partnerEloDelta;
};
exports.MatchResult = MatchResult;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MatchResult.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], MatchResult.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'partner_id' }),
    __metadata("design:type", user_entity_1.User)
], MatchResult.prototype, "partner", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sport_category_entity_1.SportCategory, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'sport_category_id' }),
    __metadata("design:type", sport_category_entity_1.SportCategory)
], MatchResult.prototype, "sportCategory", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['win', 'lose', 'draw'], nullable: true }),
    __metadata("design:type", String)
], MatchResult.prototype, "senderResult", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_handicap', default: false }),
    __metadata("design:type", Boolean)
], MatchResult.prototype, "isHandicap", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MatchStatus, default: MatchStatus.PENDING }),
    __metadata("design:type", String)
], MatchResult.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'expired_time', nullable: false }),
    __metadata("design:type", Date)
], MatchResult.prototype, "expiredTime", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp', name: 'created_at', nullable: false }),
    __metadata("design:type", Date)
], MatchResult.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'played_at', nullable: false }),
    __metadata("design:type", Date)
], MatchResult.prototype, "playedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'played_date', nullable: false }),
    __metadata("design:type", Date)
], MatchResult.prototype, "playedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'confirmed_at', nullable: true }),
    __metadata("design:type", Date)
], MatchResult.prototype, "confirmedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['win', 'lose', 'draw'], nullable: false, name: 'partner_result' }),
    __metadata("design:type", String)
], MatchResult.prototype, "partnerResult", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'pair_user_lo', nullable: false }),
    __metadata("design:type", Number)
], MatchResult.prototype, "pairUserLo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'pair_user_hi', nullable: false }),
    __metadata("design:type", Number)
], MatchResult.prototype, "pairUserHi", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'elo_before', nullable: true }),
    __metadata("design:type", Number)
], MatchResult.prototype, "eloBefore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'elo_after', nullable: true }),
    __metadata("design:type", Number)
], MatchResult.prototype, "eloAfter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'elo_delta', nullable: true }),
    __metadata("design:type", Number)
], MatchResult.prototype, "eloDelta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'partner_elo_before', nullable: true }),
    __metadata("design:type", Number)
], MatchResult.prototype, "partnerEloBefore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'partner_elo_after', nullable: true }),
    __metadata("design:type", Number)
], MatchResult.prototype, "partnerEloAfter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'partner_elo_delta', nullable: true }),
    __metadata("design:type", Number)
], MatchResult.prototype, "partnerEloDelta", void 0);
exports.MatchResult = MatchResult = __decorate([
    (0, typeorm_1.Entity)('match_result')
], MatchResult);
//# sourceMappingURL=match-result.entity.js.map