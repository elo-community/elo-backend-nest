import { Repository } from 'typeorm';
import { PostHate } from '../entities/post-hate.entity';
import { Post } from '../entities/post.entity';
export declare class PostHateService {
    private postHateRepository;
    private postRepository;
    constructor(postHateRepository: Repository<PostHate>, postRepository: Repository<Post>);
    createHate(postId: number, userId: number): Promise<PostHate>;
    getHateCount(postId: number): Promise<number>;
    findOne(postId: number, userId: number): Promise<PostHate | null>;
    updateHate(postHate: PostHate): Promise<PostHate>;
}
