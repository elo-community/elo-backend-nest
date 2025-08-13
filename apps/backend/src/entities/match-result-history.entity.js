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
exports.MatchResultHistory = void 0;
const typeorm_1 = require("typeorm");
const match_result_entity_1 = require("./match-result.entity");
const user_entity_1 = require("./user.entity");
let MatchResultHistory = class MatchResultHistory {
    id;
    matchResult;
    aUser;
    bUser;
    aOld;
    aNew;
    aDelta;
    bOld;
    bNew;
    bDelta;
    kEff;
    h2hGap;
    createdAt;
};
exports.MatchResultHistory = MatchResultHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MatchResultHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => match_result_entity_1.MatchResult, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'match_result_id' }),
    __metadata("design:type", match_result_entity_1.MatchResult)
], MatchResultHistory.prototype, "matchResult", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'a_user_id' }),
    __metadata("design:type", user_entity_1.User)
], MatchResultHistory.prototype, "aUser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'b_user_id' }),
    __metadata("design:type", user_entity_1.User)
], MatchResultHistory.prototype, "bUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 2, nullable: false, name: 'a_old' }),
    __metadata("design:type", Number)
], MatchResultHistory.prototype, "aOld", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 2, nullable: false, name: 'a_new' }),
    __metadata("design:type", Number)
], MatchResultHistory.prototype, "aNew", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 2, nullable: false, name: 'a_delta' }),
    __metadata("design:type", Number)
], MatchResultHistory.prototype, "aDelta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 2, nullable: false, name: 'b_old' }),
    __metadata("design:type", Number)
], MatchResultHistory.prototype, "bOld", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 2, nullable: false, name: 'b_new' }),
    __metadata("design:type", Number)
], MatchResultHistory.prototype, "bNew", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 2, nullable: false, name: 'b_delta' }),
    __metadata("design:type", Number)
], MatchResultHistory.prototype, "bDelta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 2, nullable: false, name: 'k_eff' }),
    __metadata("design:type", Number)
], MatchResultHistory.prototype, "kEff", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: false, name: 'h2h_gap' }),
    __metadata("design:type", Number)
], MatchResultHistory.prototype, "h2hGap", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp', name: 'created_at' }),
    __metadata("design:type", Date)
], MatchResultHistory.prototype, "createdAt", void 0);
exports.MatchResultHistory = MatchResultHistory = __decorate([
    (0, typeorm_1.Entity)('match_result_history')
], MatchResultHistory);
//# sourceMappingURL=match-result-history.entity.js.map