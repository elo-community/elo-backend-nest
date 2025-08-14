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
exports.Comment = void 0;
const typeorm_1 = require("typeorm");
const comment_like_entity_1 = require("./comment-like.entity");
const post_entity_1 = require("./post.entity");
const reply_entity_1 = require("./reply.entity");
const user_entity_1 = require("./user.entity");
let Comment = class Comment {
    id;
    user;
    post;
    createdAt;
    updatedAt;
    content;
    replies;
    likes;
};
exports.Comment = Comment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Comment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.comments, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Comment.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => post_entity_1.Post, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'post_id' }),
    __metadata("design:type", post_entity_1.Post)
], Comment.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'created_at', nullable: false }),
    __metadata("design:type", Date)
], Comment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'updated_at', nullable: false }),
    __metadata("design:type", Date)
], Comment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Comment.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => reply_entity_1.Reply, reply => reply.comment, { cascade: true }),
    __metadata("design:type", Array)
], Comment.prototype, "replies", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => comment_like_entity_1.CommentLike, commentLike => commentLike.comment, { cascade: true }),
    __metadata("design:type", Array)
], Comment.prototype, "likes", void 0);
exports.Comment = Comment = __decorate([
    (0, typeorm_1.Entity)('comment')
], Comment);
//# sourceMappingURL=comment.entity.js.map