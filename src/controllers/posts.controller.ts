import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CommentResponseDto } from 'src/dtos/comment-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/user.decorator';
import { PostDetailResponseDto } from '../dtos/post-detail-response.dto';
import { PostResponseDto } from '../dtos/post-response.dto';
import { CreatePostDto, PostQueryDto, UpdatePostDto } from '../dtos/post.dto';
import { CommentService } from '../services/comment.service';
import { PostService } from '../services/post.service';

@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
    constructor(
        private readonly postService: PostService,
        private readonly commentService: CommentService,
    ) { }

    @Public()
    @Get()
    async findAll(@Query() query: PostQueryDto) {
        const posts = await this.postService.findAll(query);
        return {
            success: true,
            data: posts.map((post) => new PostResponseDto(post)),
            message: 'Posts retrieved successfully'
        };
    }

    // @Public()
    // @Get('hot')
    // async findHot() {
    //     const posts = await this.postService.findHot();
    //     return {
    //         success: true,
    //         data: posts.map((post) => new PostResponseDto(post)),
    //         message: 'Hot posts retrieved successfully'
    //     };
    // }

    @Public()
    @Get(':id')
    async findOneWithDetails(@Param('id') id: number) {
        const post = await this.postService.findOneWithDetails(id);
        if (!post) {
            return {
                success: false,
                message: 'Post not found'
            };
        }
        return {
            success: true,
            data: new PostDetailResponseDto(post),
            message: 'Post with details retrieved successfully'
        };
    }

    @Public()
    @Get(':postId/comments')
    async getCommentsByPost(@Param('postId') postId: string) {
        const comments = await this.commentService.findByPostId(postId);
        return {
            success: true,
            data: comments.map(({ comment }) => new CommentResponseDto(comment)),
            message: 'Comments retrieved successfully'
        };
    }

    @Post()
    async create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: JwtUser) {
        const post = await this.postService.create(createPostDto, user);
        return {
            success: true,
            data: new PostResponseDto(post),
            message: 'Post created successfully'
        };
    }

    @Put(':id')
    async update(@Param('id') id: number, @Body() updatePostDto: UpdatePostDto) {
        const post = await this.postService.update(id, updatePostDto);
        if (!post) {
            return {
                success: false,
                message: 'Post not found'
            };
        }
        return {
            success: true,
            data: new PostResponseDto(post),
            message: 'Post updated successfully'
        };
    }

    @Delete(':id')
    async remove(@Param('id') id: number) {
        const result = await this.postService.remove(id);
        return {
            success: true,
            data: { deleted: !!result.affected },
            message: 'Post deleted successfully'
        };
    }
} 