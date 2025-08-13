import { Comment } from './comment.entity';
import { User } from './user.entity';
export declare class Reply {
    id: number;
    user: User;
    comment: Comment;
    createdAt: Date;
    updatedAt: Date;
    content?: string;
}
