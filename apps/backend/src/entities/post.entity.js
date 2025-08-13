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
exports.Post = void 0;
const typeorm_1 = require("typeorm");
const comment_entity_1 = require("./comment.entity");
const post_hate_entity_1 = require("./post-hate.entity");
const post_like_entity_1 = require("./post-like.entity");
const sport_category_entity_1 = require("./sport-category.entity");
const user_entity_1 = require("./user.entity");
let Post = class Post {
    id;
    author;
    content;
    createdAt;
    updatedAt;
    title;
    type;
    isHidden;
    viewCount;
    sportCategory;
    comments;
    likes;
    hates;
    imageUrls;
};
exports.Post = Post;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Post.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'author_id' }),
    __metadata("design:type", user_entity_1.User)
], Post.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Post.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp', name: 'created_at', nullable: false }),
    __metadata("design:type", Date)
], Post.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp', name: 'updated_at', nullable: false }),
    __metadata("design:type", Date)
], Post.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Post.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Post.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_hidden', default: false }),
    __metadata("design:type", Boolean)
], Post.prototype, "isHidden", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'view_count', default: 0 }),
    __metadata("design:type", Number)
], Post.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sport_category_entity_1.SportCategory, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'sport_category_id' }),
    __metadata("design:type", sport_category_entity_1.SportCategory)
], Post.prototype, "sportCategory", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => comment_entity_1.Comment, (comment) => comment.post),
    __metadata("design:type", Array)
], Post.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => post_like_entity_1.PostLike, (like) => like.post),
    __metadata("design:type", Array)
], Post.prototype, "likes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => post_hate_entity_1.PostHate, (hate) => hate.post),
    __metadata("design:type", Array)
], Post.prototype, "hates", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], Post.prototype, "imageUrls", void 0);
exports.Post = Post = __decorate([
    (0, typeorm_1.Entity)('post')
], Post);
//# sourceMappingURL=post.entity.js.map