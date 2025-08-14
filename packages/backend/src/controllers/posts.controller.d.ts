import { Request } from 'express';
import { CommentResponseDto } from 'src/dtos/comment-response.dto';
import { JwtUser } from '../auth/jwt-user.interface';
import { PostDetailResponseDto } from '../dtos/post-detail-response.dto';
import { PostResponseDto } from '../dtos/post-response.dto';
import { CreatePostDto, HotPostResponseDto, PostQueryDto, UpdatePostDto } from '../dtos/post.dto';
import { CommentService } from '../services/comment.service';
import { PostService } from '../services/post.service';
export declare class PostsController {
    private readonly postService;
    private readonly commentService;
    constructor(postService: PostService, commentService: CommentService);
    findAll(query: PostQueryDto, user?: JwtUser): Promise<{
        success: boolean;
        data: PostResponseDto[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
        message: string;
    }>;
    findHot(): Promise<{
        success: boolean;
        data: HotPostResponseDto[];
        message: string;
    }>;
    findRealTimeHot(): Promise<{
        success: boolean;
        data: {
            categoryId: any;
            categoryName: any;
            posts: any;
        }[];
        message: string;
    }>;
    findStoredHot(dateStr?: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: HotPostResponseDto[];
        message: string;
    }>;
    findOneWithDetails(id: number, req: Request, user?: JwtUser): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: PostDetailResponseDto;
        message: string;
    }>;
    getCommentsByPost(postId: string, user?: JwtUser): Promise<{
        success: boolean;
        data: CommentResponseDto[];
        message: string;
    }>;
    create(createPostDto: CreatePostDto, user: JwtUser): Promise<{
        success: boolean;
        data: PostResponseDto;
        message: string;
    }>;
    update(id: number, updatePostDto: UpdatePostDto): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: PostResponseDto;
        message: string;
    }>;
    remove(id: number): Promise<{
        success: boolean;
        data: {
            deleted: boolean;
        };
        message: string;
    }>;
}
