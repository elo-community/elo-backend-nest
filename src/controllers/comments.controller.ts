import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/user.decorator';
import { CommentResponseDto } from '../dtos/comment-response.dto';
import { CommentQueryDto, CreateCommentDto, UpdateCommentDto } from '../dtos/comment.dto';
import { CommentService } from '../services/comment.service';


@Controller('comments')
export class CommentsController {
    constructor(private readonly commentService: CommentService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(@Query() query: CommentQueryDto, @CurrentUser() user: JwtUser) {
        const comments = await this.commentService.findAll(query);
        return {
            success: true,
            data: comments.map(comment =>
                new CommentResponseDto(comment, user.id)
            ),
            message: 'Comments retrieved successfully'
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id') id: number, @CurrentUser() user: JwtUser) {
        const { comment } = await this.commentService.findOne(id);
        return {
            success: true,
            data: new CommentResponseDto(comment, user.id),
            message: 'Comment retrieved successfully'
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() createCommentDto: CreateCommentDto, @CurrentUser() user: JwtUser) {
        const { comment } = await this.commentService.create(createCommentDto, user);
        return {
            success: true,
            data: new CommentResponseDto(comment, user.id),
            message: 'Comment created successfully'
        };
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async update(@Param('id') id: number, @Body() updateCommentDto: UpdateCommentDto, @CurrentUser() user: JwtUser) {
        const { comment } = await this.commentService.update(id, updateCommentDto, user);
        return {
            success: true,
            data: new CommentResponseDto(comment, user.id),
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
    @UseGuards(OptionalJwtAuthGuard)
    @Get('post/:postId/tree')
    async getCommentTree(@Param('postId') postId: string, @CurrentUser() user?: JwtUser) {
        const comments = await this.commentService.getCommentTree(Number(postId));
        return {
            success: true,
            data: comments.map(comment => new CommentResponseDto(comment, user?.id)),
            message: 'Comment tree retrieved successfully'
        };
    }
} 