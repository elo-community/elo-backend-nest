import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/user.decorator';
import { CommentResponseDto } from '../dtos/comment-response.dto';
import { CommentQueryDto, CreateCommentDto, UpdateCommentDto } from '../dtos/comment.dto';
import { CommentService } from '../services/comment.service';

interface LikeCountResponseDto {
    commentId: number;
    likeCount: number;
}

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentService: CommentService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(@Query() query: CommentQueryDto) {
        const comments = await this.commentService.findAll(query);
        return {
            success: true,
            data: comments.map(({ comment }) =>
                new CommentResponseDto(comment)
            ),
            message: 'Comments retrieved successfully'
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id') id: number) {
        const { comment } = await this.commentService.findOne(id);
        return {
            success: true,
            data: new CommentResponseDto(comment),
            message: 'Comment retrieved successfully'
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() createCommentDto: CreateCommentDto, @CurrentUser() user: JwtUser) {
        const { comment } = await this.commentService.create(createCommentDto, user);
        return {
            success: true,
            data: new CommentResponseDto(comment),
            message: 'Comment created successfully'
        };
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async update(@Param('id') id: number, @Body() updateCommentDto: UpdateCommentDto, @CurrentUser() user: JwtUser) {
        const { comment } = await this.commentService.update(id, updateCommentDto, user);
        return {
            success: true,
            data: new CommentResponseDto(comment),
            message: 'Comment updated successfully'
        };
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async remove(@Param('id') id: number, @CurrentUser() user: JwtUser) {
        const result = await this.commentService.remove(id, user);
        return {
            success: true,
            data: { deleted: !!result.affected },
            message: 'Comment deleted successfully'
        };
    }

    @Public()
    @Get('post/:postId')
    async getCommentsByPost(@Param('postId') postId: string) {
        const comments = await this.commentService.findByPostId(postId);
        return {
            success: true,
            data: comments.map(({ comment }) => new CommentResponseDto(comment)),
            message: 'Comments retrieved successfully'
        };
    }

    @Public()
    @Get('post/:postId/tree')
    async getCommentTree(@Param('postId') postId: string) {
        const comments = await this.commentService.getCommentTree(Number(postId));
        return {
            success: true,
            data: comments.map(({ comment }) => new CommentResponseDto(comment)),
            message: 'Comment tree retrieved successfully'
        };
    }
} 