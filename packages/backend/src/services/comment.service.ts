import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { CommentQueryDto, CreateCommentDto, UpdateCommentDto } from '../dtos/comment.dto';
import { Comment } from '../entities/comment.entity';
import { CommentLikeService } from './comment-like.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly commentLikeService: CommentLikeService,
  ) {}

  async findAll(query?: CommentQueryDto) {
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
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

  async findOne(id: number) {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user', 'post', 'replies', 'replies.user', 'likes', 'likes.user'],
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return { comment };
  }

  async create(createCommentDto: CreateCommentDto, user: JwtUser) {
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

  async update(id: number, updateCommentDto: UpdateCommentDto, user: JwtUser) {
    const { comment } = await this.findOne(id);

    // 작성자만 수정 가능
    if (comment.user.id !== user.id) {
      throw new BadRequestException('Only the comment author can update this comment');
    }

    await this.commentRepository.update(id, {
      ...updateCommentDto,
      updatedAt: new Date(),
    });

    return this.findOne(id);
  }

  async remove(id: number, user: JwtUser) {
    const { comment } = await this.findOne(id);

    // 작성자만 삭제 가능
    if (comment.user.id !== user.id) {
      throw new BadRequestException('Only the comment author can delete this comment');
    }

    // 대댓글이 있는 경우 soft delete 또는 내용만 삭제
    if (comment.replies && comment.replies.length > 0) {
      await this.commentRepository.update(id, {
        content: '[삭제된 댓글입니다]',
        updatedAt: new Date(),
      });
      return { affected: 1 };
    }

    return this.commentRepository.delete(id);
  }

  async findByPostId(postId: string | number) {
    const comments = await this.commentRepository.find({
      where: { post: { id: Number(postId) } },
      relations: ['user', 'post', 'replies', 'replies.user', 'likes', 'likes.user'],
      order: {
        createdAt: 'ASC',
        replies: {
          createdAt: 'ASC',
        },
      },
    });

    return comments;
  }

  async getCommentTree(postId: number) {
    // 게시글의 모든 댓글을 트리 구조로 반환
    const comments = await this.commentRepository.find({
      where: { post: { id: postId } },
      relations: ['user', 'replies', 'replies.user', 'likes', 'likes.user'],
      order: {
        createdAt: 'ASC',
        replies: {
          createdAt: 'ASC',
        },
      },
    });

    return comments;
  }
}
