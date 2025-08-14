import { CommentLike } from './comment-like.entity';
import { Post } from './post.entity';
import { Reply } from './reply.entity';
import { User } from './user.entity';
export declare class Comment {
    id: number;
    user: User;
    post: Post;
    createdAt: Date;
    updatedAt: Date;
    content: string;
    replies?: Reply[];
    likes?: CommentLike[];
}
