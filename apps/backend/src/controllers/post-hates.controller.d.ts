import { JwtUser } from 'src/auth/jwt-user.interface';
import { PostHateService } from '../services/post-hate.service';
interface HateCountResponseDto {
    postId: number;
    hateCount: number;
}
export declare class PostHatesController {
    private readonly postHateService;
    constructor(postHateService: PostHateService);
    createHate(postId: number, user: JwtUser): Promise<{
        message: string;
        data: {
            postId: number;
            success: boolean;
            isHated: boolean;
            hateCount: number;
        };
    }>;
    getHateCount(postId: number): Promise<HateCountResponseDto>;
}
export {};
