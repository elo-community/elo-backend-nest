import { Comment } from './comment.entity';
import { User } from './user.entity';
export declare class CommentLike {
    id: number;
    user: User;
    comment: Comment;
    isLiked?: boolean;
}
