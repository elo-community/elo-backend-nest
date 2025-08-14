import { PostService } from '../services/post.service';
export declare class RealTimeHotPostsScheduler {
    private readonly postService;
    private readonly logger;
    constructor(postService: PostService);
    updateRealTimeHotPosts(): Promise<void>;
    quickHealthCheck(): Promise<void>;
}
