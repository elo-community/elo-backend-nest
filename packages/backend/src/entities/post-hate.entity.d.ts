import { Post } from './post.entity';
import { User } from './user.entity';
export declare class PostHate {
    id: number;
    user: User;
    post: Post;
    isHated?: boolean;
    createdAt: Date;
}
