import { JwtUser } from '../auth/jwt-user.interface';
import { CommentResponseDto } from '../dtos/comment-response.dto';
import { CommentQueryDto, CreateCommentDto, UpdateCommentDto } from '../dtos/comment.dto';
import { CommentService } from '../services/comment.service';
export declare class CommentsController {
    private readonly commentService;
    constructor(commentService: CommentService);
    findAll(query: CommentQueryDto, user: JwtUser): Promise<{
        success: boolean;
        data: CommentResponseDto[];
        message: string;
    }>;
    findOne(id: number, user: JwtUser): Promise<{
        success: boolean;
        data: CommentResponseDto;
        message: string;
    }>;
    create(createCommentDto: CreateCommentDto, user: JwtUser): Promise<{
        success: boolean;
        data: CommentResponseDto;
        message: string;
    }>;
    update(id: number, updateCommentDto: UpdateCommentDto, user: JwtUser): Promise<{
        success: boolean;
        data: CommentResponseDto;
        message: string;
    }>;
    remove(id: number, user: JwtUser): Promise<{
        success: boolean;
        data: {
            deleted: boolean;
        };
        message: string;
    }>;
    getCommentTree(postId: string, user?: JwtUser): Promise<{
        success: boolean;
        data: CommentResponseDto[];
        message: string;
    }>;
}
