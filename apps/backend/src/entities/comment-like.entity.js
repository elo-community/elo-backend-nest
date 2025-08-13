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
exports.CommentLike = void 0;
const typeorm_1 = require("typeorm");
const comment_entity_1 = require("./comment.entity");
const user_entity_1 = require("./user.entity");
let CommentLike = class CommentLike {
    id;
    user;
    comment;
    isLiked;
};
exports.CommentLike = CommentLike;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CommentLike.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], CommentLike.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => comment_entity_1.Comment, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'comment_id' }),
    __metadata("design:type", comment_entity_1.Comment)
], CommentLike.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_liked', nullable: true }),
    __metadata("design:type", Boolean)
], CommentLike.prototype, "isLiked", void 0);
exports.CommentLike = CommentLike = __decorate([
    (0, typeorm_1.Entity)('comment_like')
], CommentLike);
//# sourceMappingURL=comment-like.entity.js.map