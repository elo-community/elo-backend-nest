import { Post } from './post.entity';
import { User } from './user.entity';
export declare class PostLike {
    id: number;
    user: User;
    post: Post;
    isLiked?: boolean;
    createdAt: Date;
}
