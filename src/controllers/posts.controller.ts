import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { PostResponseDto } from '../dtos/post-response.dto';
import { CreatePostDto, UpdatePostDto } from '../dtos/post.dto';
import { PostService } from '../services/post.service';

@Controller('posts')
export class PostsController {
    constructor(private readonly postService: PostService) { }

    @Get()
    async findAll(): Promise<PostResponseDto[]> {
        const posts = await this.postService.findAll();
        return posts.map((post) => new PostResponseDto(post));
    }

    @Get(':id')
    async findOne(@Param('id') id: number): Promise<PostResponseDto | null> {
        const post = await this.postService.findOne(id);
        return post ? new PostResponseDto(post) : null;
    }

    @Post()
    async create(@Body() createPostDto: CreatePostDto): Promise<PostResponseDto> {
        const post = await this.postService.create(createPostDto);
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