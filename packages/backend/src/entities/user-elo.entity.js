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
exports.UserElo = void 0;
const typeorm_1 = require("typeorm");
const sport_category_entity_1 = require("./sport-category.entity");
const user_entity_1 = require("./user.entity");
let UserElo = class UserElo {
    id;
    sportCategory;
    user;
    eloPoint;
    tier;
    percentile;
    wins;
    losses;
    draws;
    totalMatches;
};
exports.UserElo = UserElo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserElo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sport_category_entity_1.SportCategory, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'sport_category_id' }),
    __metadata("design:type", sport_category_entity_1.SportCategory)
], UserElo.prototype, "sportCategory", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserElo.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'elo_point', nullable: false, default: 1400 }),
    __metadata("design:type", Number)
], UserElo.prototype, "eloPoint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: false, default: 'BRONZE' }),
    __metadata("design:type", String)
], UserElo.prototype, "tier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: false, default: 50.00 }),
    __metadata("design:type", Number)
], UserElo.prototype, "percentile", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'wins', nullable: false, default: 0 }),
    __metadata("design:type", Number)
], UserElo.prototype, "wins", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'losses', nullable: false, default: 0 }),
    __metadata("design:type", Number)
], UserElo.prototype, "losses", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'draws', nullable: false, default: 0 }),
    __metadata("design:type", Number)
], UserElo.prototype, "draws", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'total_matches', nullable: false, default: 0 }),
    __metadata("design:type", Number)
], UserElo.prototype, "totalMatches", void 0);
exports.UserElo = UserElo = __decorate([
    (0, typeorm_1.Entity)('user_elo')
], UserElo);
//# sourceMappingURL=user-elo.entity.js.map