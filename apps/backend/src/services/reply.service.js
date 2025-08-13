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
exports.ReplyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const comment_entity_1 = require("../entities/comment.entity");
const reply_entity_1 = require("../entities/reply.entity");
let ReplyService = class ReplyService {
    replyRepository;
    commentRepository;
    constructor(replyRepository, commentRepository) {
        this.replyRepository = replyRepository;
        this.commentRepository = commentRepository;
    }
    async findAll(query) {
        const queryBuilder = this.replyRepository.createQueryBuilder('reply')
            .leftJoinAndSelect('reply.user', 'user')
            .leftJoinAndSelect('reply.comment', 'comment');
        if (query?.commentId) {
            queryBuilder.andWhere('reply.comment.id = :commentId', { commentId: query.commentId });
        }
        queryBuilder.orderBy('reply.createdAt', 'ASC');
        return queryBuilder.getMany();
    }
    async findOne(id) {
        const reply = await this.replyRepository.findOne({
            where: { id },
            relations: ['user', 'comment']
        });
        if (!reply) {
            throw new common_1.NotFoundException(`Reply with ID ${id} not found`);
        }
        return reply;
    }
    async create(createReplyDto, user) {
        const comment = await this.commentRepository.findOne({
            where: { id: createReplyDto.commentId }
        });
        if (!comment) {
            throw new common_1.NotFoundException(`Comment with ID ${createReplyDto.commentId} not found`);
        }
        const reply = this.replyRepository.create({
            content: createReplyDto.content,
            comment: comment,
            user: { id: user.id },
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        const savedReply = await this.replyRepository.save(reply);
        return this.findOne(savedReply.id);
    }
    async update(id, updateReplyDto, user) {
        const reply = await this.findOne(id);
        if (reply.user.id !== user.id) {
            throw new common_1.BadRequestException('Only the reply author can update this reply');
        }
        await this.replyRepository.update(id, {
            ...updateReplyDto,
            updatedAt: new Date()
        });
        return this.findOne(id);
    }
    async remove(id, user) {
        const reply = await this.findOne(id);
        if (reply.user.id !== user.id) {
            throw new common_1.BadRequestException('Only the reply author can delete this reply');
        }
        return this.replyRepository.delete(id);
    }
    async findByCommentId(commentId) {
        return this.replyRepository.find({
            where: { comment: { id: commentId } },
            relations: ['user'],
            order: { createdAt: 'ASC' }
        });
    }
};
exports.ReplyService = ReplyService;
exports.ReplyService = ReplyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reply_entity_1.Reply)),
    __param(1, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ReplyService);
//# sourceMappingURL=reply.service.js.map