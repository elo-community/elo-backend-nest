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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostHateService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_hate_entity_1 = require("../entities/post-hate.entity");
const post_entity_1 = require("../entities/post.entity");
let PostHateService = class PostHateService {
    postHateRepository;
    postRepository;
    constructor(postHateRepository, postRepository) {
        this.postHateRepository = postHateRepository;
        this.postRepository = postRepository;
    }
    async createHate(postId, userId) {
        const post = await this.postRepository.findOne({ where: { id: postId } });
        if (!post) {
            throw new common_1.NotFoundException(`Post with ID ${postId} not found`);
        }
        const existingHate = await this.postHateRepository.findOne({
            where: { post: { id: postId }, user: { id: userId } },
        });
        if (existingHate) {
            existingHate.isHated = !existingHate.isHated;
            return await this.postHateRepository.save(existingHate);
        }
        const postHate = this.postHateRepository.create({
            post: { id: postId },
            isHated: true,
            user: { id: userId },
        });
        return await this.postHateRepository.save(postHate);
    }
    async getHateCount(postId) {
        const post = await this.postRepository.findOne({ where: { id: postId } });
        if (!post) {
            throw new common_1.NotFoundException(`Post with ID ${postId} not found`);
        }
        return await this.postHateRepository.count({
            where: { post: { id: postId }, isHated: true },
        });
    }
    async findOne(postId, userId) {
        return await this.postHateRepository.findOne({
            where: { post: { id: postId }, user: { id: userId } },
        });
    }
    async updateHate(postHate) {
        return await this.postHateRepository.save(postHate);
    }
};
exports.PostHateService = PostHateService;
exports.PostHateService = PostHateService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_hate_entity_1.PostHate)),
    __param(1, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PostHateService);
//# sourceMappingURL=post-hate.service.js.map