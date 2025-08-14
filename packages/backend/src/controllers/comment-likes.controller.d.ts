import { JwtUser } from 'src/auth/jwt-user.interface';
import { CommentLikeService } from '../services/comment-like.service';
interface LikeCountResponseDto {
    commentId: number;
    likeCount: number;
}
export declare class CommentLikesController {
    private readonly commentLikeService;
    constructor(commentLikeService: CommentLikeService);
    createLike(commentId: number, user: JwtUser): Promise<{
        message: string;
        data: {
            commentId: number;
            success: boolean;
            isLiked: boolean;
            likeCount: number;
        };
    }>;
    getLikeCount(commentId: number): Promise<LikeCountResponseDto>;
}
export {};
