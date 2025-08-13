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
exports.HotPost = void 0;
const typeorm_1 = require("typeorm");
const post_entity_1 = require("./post.entity");
let HotPost = class HotPost {
    id;
    post;
    postId;
    popularityScore;
    rank;
    selectionDate;
    isRewarded;
    createdAt;
    rewardAmount;
    rewardedAt;
};
exports.HotPost = HotPost;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], HotPost.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => post_entity_1.Post, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'post_id' }),
    __metadata("design:type", post_entity_1.Post)
], HotPost.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'post_id', nullable: false }),
    __metadata("design:type", Number)
], HotPost.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, name: 'popularity_score', nullable: false }),
    __metadata("design:type", Number)
], HotPost.prototype, "popularityScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'rank', nullable: false }),
    __metadata("design:type", Number)
], HotPost.prototype, "rank", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'selection_date', nullable: false }),
    __metadata("design:type", Date)
], HotPost.prototype, "selectionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_rewarded', default: false }),
    __metadata("design:type", Boolean)
], HotPost.prototype, "isRewarded", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp', name: 'created_at', nullable: false }),
    __metadata("design:type", Date)
], HotPost.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 20, scale: 8, name: 'reward_amount', nullable: true }),
    __metadata("design:type", Number)
], HotPost.prototype, "rewardAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'rewarded_at', nullable: true }),
    __metadata("design:type", Date)
], HotPost.prototype, "rewardedAt", void 0);
exports.HotPost = HotPost = __decorate([
    (0, typeorm_1.Entity)('hot_post')
], HotPost);
//# sourceMappingURL=hot-post.entity.js.map