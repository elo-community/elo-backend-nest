import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { CommentResponseDto } from '../dtos/comment-response.dto';
import { CreateCommentDto, UpdateCommentDto } from '../dtos/comment.dto';
import { CommentService } from '../services/comment.service';

@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
    constructor(private readonly commentService: CommentService) { }

    @Get()
    async findAll(): Promise<CommentResponseDto[]> {
        const comments = await this.commentService.findAll();
        return comments.map((comment) => new CommentResponseDto(comment));
    }

    @Get(':id')
    async findOne(@Param('id') id: number): Promise<CommentResponseDto | null> {
        const comment = await this.commentService.findOne(id);
        return comment ? new CommentResponseDto(comment) : null;
    }

    @Post()
    async create(@Body() createCommentDto: CreateCommentDto): Promise<CommentResponseDto> {
        const comment = await this.commentService.create(createCommentDto);
        return new CommentResponseDto(comment);
    }

    @Put(':id')
    async update(@Param('id') id: number, @Body() updateCommentDto: UpdateCommentDto): Promise<CommentResponseDto | null> {
        const comment = await this.commentService.update(id, updateCommentDto);
        return comment ? new CommentResponseDto(comment) : null;
    }

    @Delete(':id')
    async remove(@Param('id') id: number): Promise<{ deleted: boolean }> {
        const result = await this.commentService.remove(id);
        return { deleted: !!result.affected };
    }

    @Public()
    @Get(':postId')
    getCommentsByPost(@Param('postId') postId: string) {
        // 실제 구현에 맞게 수정 필요
        return this.commentService.findByPostId(postId);
    }
} 