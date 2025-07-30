import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentLike } from '../entities/comment-like.entity';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class CommentLikeService {
    constructor(
        @InjectRepository(CommentLike)
        private commentLikeRepository: Repository<CommentLike>,
        @InjectRepository(Comment)
        private commentRepository: Repository<Comment>,
    ) { }

    async createLike(commentId: number, userId: number): Promise<CommentLike> {
        // 댓글이 존재하는지 확인
        const comment = await this.commentRepository.findOne({ where: { id: commentId } });
        if (!comment) {
            throw new NotFoundException(`Comment with ID ${commentId} not found`);
        }

        // 이미 좋아요를 눌렀는지 확인
        const existingLike = await this.commentLikeRepository.findOne({
            where: { comment: { id: commentId }, user: { id: userId } },
        });

        if (existingLike) {
            // 이미 좋아요가 있으면 토글
            existingLike.isLiked = !existingLike.isLiked;
            return await this.commentLikeRepository.save(existingLike);
        }

        // 새로운 좋아요 생성
        const commentLike = this.commentLikeRepository.create({
            comment: { id: commentId },
            isLiked: true,
            user: { id: userId },
        });

        return await this.commentLikeRepository.save(commentLike);
    }

    async getLikeCount(commentId: number): Promise<number> {
        // 댓글이 존재하는지 확인
        const comment = await this.commentRepository.findOne({ where: { id: commentId } });
        if (!comment) {
            throw new NotFoundException(`Comment with ID ${commentId} not found`);
        }

        // 해당 댓글의 좋아요 개수 조회
        return await this.commentLikeRepository.count({
            where: { comment: { id: commentId }, isLiked: true },
        });
    }

    async findOne(commentId: number, userId: number): Promise<CommentLike | null> {
        return await this.commentLikeRepository.findOne({
            where: { comment: { id: commentId }, user: { id: userId } },
        });
    }

    async updateLike(commentLike: CommentLike): Promise<CommentLike> {
        return await this.commentLikeRepository.save(commentLike);
    }
} 