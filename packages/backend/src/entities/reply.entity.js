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
exports.Reply = void 0;
const typeorm_1 = require("typeorm");
const comment_entity_1 = require("./comment.entity");
const user_entity_1 = require("./user.entity");
let Reply = class Reply {
    id;
    user;
    comment;
    createdAt;
    updatedAt;
    content;
};
exports.Reply = Reply;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Reply.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Reply.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => comment_entity_1.Comment, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'comment_id' }),
    __metadata("design:type", comment_entity_1.Comment)
], Reply.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'created_at', nullable: false }),
    __metadata("design:type", Date)
], Reply.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'updated_at', nullable: false }),
    __metadata("design:type", Date)
], Reply.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Reply.prototype, "content", void 0);
exports.Reply = Reply = __decorate([
    (0, typeorm_1.Entity)('reply')
], Reply);
//# sourceMappingURL=reply.entity.js.map