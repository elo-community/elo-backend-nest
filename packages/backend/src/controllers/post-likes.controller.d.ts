import { JwtUser } from 'src/auth/jwt-user.interface';
import { PostLikeService } from '../services/post-like.service';
interface LikeCountResponseDto {
    postId: number;
    likeCount: number;
}
export declare class PostLikesController {
    private readonly postLikeService;
    constructor(postLikeService: PostLikeService);
    createLike(postId: number, user: JwtUser): Promise<{
        message: string;
        data: {
            postId: number;
            success: boolean;
            isLiked: boolean;
            likeCount: number;
        };
    }>;
    getLikeCount(postId: number): Promise<LikeCountResponseDto>;
}
export {};
