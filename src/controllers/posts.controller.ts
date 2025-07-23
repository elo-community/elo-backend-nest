import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtUser } from 'src/auth/jwt-user.interface';
import { CurrentUser } from 'src/auth/user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { PostResponseDto } from '../dtos/post-response.dto';
import { CreatePostDto, UpdatePostDto } from '../dtos/post.dto';
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
    async findAll(): Promise<PostResponseDto[]> {
        const posts = await this.postService.findAll();
        return posts.map((post) => new PostResponseDto(post));
    }

    @Public()
    @Get(':id')
    async findOne(@Param('id') id: number): Promise<PostResponseDto | null> {
        const post = await this.postService.findOne(id);
        return post ? new PostResponseDto(post) : null;
    }

    @Public()
    @Get(':postId/comments')
    async getCommentsByPost(@Param('postId') postId: string) {
        return this.commentService.findByPostId(postId);
    }

    @Post()
    async create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: JwtUser): Promise<PostResponseDto> {
        const post = await this.postService.create(createPostDto, user);
        return new PostResponseDto(post);
    }

    @Put(':id')
    async update(@Param('id') id: number, @Body() updatePostDto: UpdatePostDto): Promise<PostResponseDto | null> {
        const post = await this.postService.update(id, updatePostDto);
        return post ? new PostResponseDto(post) : null;
    }

    @Delete(':id')
    async remove(@Param('id') id: number): Promise<{ deleted: boolean }> {
        const result = await this.postService.remove(id);
        return { deleted: !!result.affected };
    }
} 