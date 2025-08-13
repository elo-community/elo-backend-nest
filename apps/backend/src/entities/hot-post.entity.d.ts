import { Post } from './post.entity';
export declare class HotPost {
    id: number;
    post: Post;
    postId: number;
    popularityScore: number;
    rank: number;
    selectionDate: Date;
    isRewarded: boolean;
    createdAt: Date;
    rewardAmount?: number;
    rewardedAt?: Date;
}
