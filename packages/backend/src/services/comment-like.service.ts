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
  ) {}

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

    // 디버깅: 모든 좋아요 레코드 조회
    await this.debugCommentLikes(commentId);

    // 해당 댓글의 좋아요 개수 조회 (isLiked가 true인 것만)
    const count = await this.commentLikeRepository.count({
      where: {
        comment: { id: commentId },
        isLiked: true,
      },
    });

    // 추가 디버깅: raw query로도 확인
    const rawCount = await this.commentLikeRepository
      .createQueryBuilder('cl')
      .where('cl.comment_id = :commentId', { commentId })
      .andWhere('cl.is_liked = :isLiked', { isLiked: true })
      .getCount();

    console.log(`Raw query count for comment ${commentId}: ${rawCount}`);

    console.log(`Comment ${commentId} like count: ${count}`);
    return count;
  }

  async findOne(commentId: number, userId: number): Promise<CommentLike | null> {
    return await this.commentLikeRepository.findOne({
      where: { comment: { id: commentId }, user: { id: userId } },
    });
  }

  async updateLike(commentLike: CommentLike): Promise<CommentLike> {
    return await this.commentLikeRepository.save(commentLike);
  }

  // 디버깅용: 특정 댓글의 모든 좋아요 레코드 조회
  async debugCommentLikes(commentId: number): Promise<CommentLike[]> {
    const likes = await this.commentLikeRepository.find({
      where: { comment: { id: commentId } },
      relations: ['user'],
    });

    console.log(
      `Debug - Comment ${commentId} likes:`,
      likes.map(like => ({
        id: like.id,
        userId: like.user?.id,
        isLiked: like.isLiked,
      })),
    );

    return likes;
  }
}
