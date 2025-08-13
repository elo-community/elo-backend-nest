import { Comment } from '../entities/comment.entity';
import { ReplyResponseDto } from './reply-response.dto';
import { UserSimpleResponseDto } from './user-response.dto';
export declare class CommentResponseDto {
    id: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    user?: UserSimpleResponseDto;
    postId: number;
    replies: ReplyResponseDto[];
    likeCount: number;
    isLiked?: boolean;
    constructor(comment: Comment, userId?: number);
}
