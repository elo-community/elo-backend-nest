import { Repository } from 'typeorm';
import { HotPost } from '../entities/hot-post.entity';
import { Post } from '../entities/post.entity';
export declare class HotPostsScheduler {
    private readonly postRepository;
    private readonly hotPostRepository;
    private readonly logger;
    constructor(postRepository: Repository<Post>, hotPostRepository: Repository<HotPost>);
    selectHotPosts(): Promise<void>;
}
