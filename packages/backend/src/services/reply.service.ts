import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { CreateReplyDto, ReplyQueryDto, UpdateReplyDto } from '../dtos/reply.dto';
import { Comment } from '../entities/comment.entity';
import { Reply } from '../entities/reply.entity';

@Injectable()
export class ReplyService {
  constructor(
    @InjectRepository(Reply)
    private readonly replyRepository: Repository<Reply>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async findAll(query?: ReplyQueryDto) {
    const queryBuilder = this.replyRepository
      .createQueryBuilder('reply')
      .leftJoinAndSelect('reply.user', 'user')
      .leftJoinAndSelect('reply.comment', 'comment');

    if (query?.commentId) {
      queryBuilder.andWhere('reply.comment.id = :commentId', { commentId: query.commentId });
    }

    queryBuilder.orderBy('reply.createdAt', 'ASC');

    return queryBuilder.getMany();
  }

  async findOne(id: number) {
    const reply = await this.replyRepository.findOne({
      where: { id },
      relations: ['user', 'comment'],
    });

    if (!reply) {
      throw new NotFoundException(`Reply with ID ${id} not found`);
    }

    return reply;
  }

  async create(createReplyDto: CreateReplyDto, user: JwtUser) {
    // 댓글이 존재하는지 확인
    const comment = await this.commentRepository.findOne({
      where: { id: createReplyDto.commentId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${createReplyDto.commentId} not found`);
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

  async update(id: number, updateReplyDto: UpdateReplyDto, user: JwtUser) {
    const reply = await this.findOne(id);

    // 작성자만 수정 가능
    if (reply.user.id !== user.id) {
      throw new BadRequestException('Only the reply author can update this reply');
    }

    await this.replyRepository.update(id, {
      ...updateReplyDto,
      updatedAt: new Date(),
    });

    return this.findOne(id);
  }

  async remove(id: number, user: JwtUser) {
    const reply = await this.findOne(id);

    // 작성자만 삭제 가능
    if (reply.user.id !== user.id) {
      throw new BadRequestException('Only the reply author can delete this reply');
    }

    return this.replyRepository.delete(id);
  }

  async findByCommentId(commentId: number) {
    return this.replyRepository.find({
      where: { comment: { id: commentId } },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }
}
