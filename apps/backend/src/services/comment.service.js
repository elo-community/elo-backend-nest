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
exports.CommentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const comment_entity_1 = require("../entities/comment.entity");
const comment_like_service_1 = require("./comment-like.service");
let CommentService = class CommentService {
    commentRepository;
    commentLikeService;
    constructor(commentRepository, commentLikeService) {
        this.commentRepository = commentRepository;
        this.commentLikeService = commentLikeService;
    }
    async findAll(query) {
        const queryBuilder = this.commentRepository.createQueryBuilder('comment')
            .leftJoinAndSelect('comment.user', 'user')
            .leftJoinAndSelect('comment.post', 'post')
            .leftJoinAndSelect('comment.replies', 'replies')
            .leftJoinAndSelect('replies.user', 'replyUser')
            .leftJoinAndSelect('comment.likes', 'likes')
            .leftJoinAndSelect('likes.user', 'likeUser');
        if (query?.postId) {
            queryBuilder.andWhere('comment.post.id = :postId', { postId: query.postId });
        }
        queryBuilder.orderBy('comment.createdAt', 'ASC');
        queryBuilder.addOrderBy('replies.createdAt', 'ASC');
        const comments = await queryBuilder.getMany();
        return comments;
    }
    async findOne(id) {
        const comment = await this.commentRepository.findOne({
            where: { id },
            relations: ['user', 'post', 'replies', 'replies.user', 'likes', 'likes.user']
        });
        if (!comment) {
            throw new common_1.NotFoundException(`Comment with ID ${id} not found`);
        }
        return { comment };
    }
    async create(createCommentDto, user) {
        const comment = this.commentRepository.create({
            content: createCommentDto.content,
            post: { id: createCommentDto.postId },
            user: { id: user.id },
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        const savedComment = await this.commentRepository.save(comment);
        return this.findOne(savedComment.id);
    }
    async update(id, updateCommentDto, user) {
        const { comment } = await this.findOne(id);
        if (comment.user.id !== user.id) {
            throw new common_1.BadRequestException('Only the comment author can update this comment');
        }
        await this.commentRepository.update(id, {
            ...updateCommentDto,
            updatedAt: new Date()
        });
        return this.findOne(id);
    }
    async remove(id, user) {
        const { comment } = await this.findOne(id);
        if (comment.user.id !== user.id) {
            throw new common_1.BadRequestException('Only the comment author can delete this comment');
        }
        if (comment.replies && comment.replies.length > 0) {
            await this.commentRepository.update(id, {
                content: '[삭제된 댓글입니다]',
                updatedAt: new Date()
            });
            return { affected: 1 };
        }
        return this.commentRepository.delete(id);
    }
    async findByPostId(postId) {
        const comments = await this.commentRepository.find({
            where: { post: { id: Number(postId) } },
            relations: ['user', 'post', 'replies', 'replies.user', 'likes', 'likes.user'],
            order: {
                createdAt: 'ASC',
                replies: {
                    createdAt: 'ASC'
                }
            }
        });
        return comments;
    }
    async getCommentTree(postId) {
        const comments = await this.commentRepository.find({
            where: { post: { id: postId } },
            relations: ['user', 'replies', 'replies.user', 'likes', 'likes.user'],
            order: {
                createdAt: 'ASC',
                replies: {
                    createdAt: 'ASC'
                }
            }
        });
        return comments;
    }
};
exports.CommentService = CommentService;
exports.CommentService = CommentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        comment_like_service_1.CommentLikeService])
], CommentService);
//# sourceMappingURL=comment.service.js.map