import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommentDto, UpdateCommentDto } from '../dtos/comment.dto';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class CommentService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
    ) { }

    findAll() {
        return this.commentRepository.find({ relations: ['user', 'post'] });
    }

    findOne(id: number) {
        return this.commentRepository.findOne({ where: { id }, relations: ['user', 'post'] });
    }

    async create(createCommentDto: CreateCommentDto) {
        const comment = this.commentRepository.create(createCommentDto);
        return this.commentRepository.save(comment);
    }

    async update(id: number, updateCommentDto: UpdateCommentDto) {
        await this.commentRepository.update(id, updateCommentDto);
        return this.findOne(id);
    }

    async remove(id: number) {
        return this.commentRepository.delete(id);
    }

    async findByPostId(postId: string | number) {
        return this.commentRepository.find({ where: { post: { id: Number(postId) } }, relations: ['user', 'post'] });
    }
} 