import { Repository } from 'typeorm';
import { PostLike } from '../entities/post-like.entity';
import { Post } from '../entities/post.entity';
export declare class PostLikeService {
    private postLikeRepository;
    private postRepository;
    constructor(postLikeRepository: Repository<PostLike>, postRepository: Repository<Post>);
    createLike(postId: number, userId: number): Promise<PostLike>;
    getLikeCount(postId: number): Promise<number>;
    findOne(postId: number, userId: number): Promise<PostLike | null>;
    updateLike(postLike: PostLike): Promise<PostLike>;
}
