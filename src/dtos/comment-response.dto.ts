import { Comment } from '../entities/comment.entity';
import { ReplyResponseDto } from './reply-response.dto';
import { UserResponseDto, UserSimpleResponseDto } from './user-response.dto';

export class CommentResponseDto {
    id: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    userNickname?: string;
    user?: UserSimpleResponseDto;
    postId: number;
    replies?: ReplyResponseDto[];

    constructor(comment: Comment) {
        this.id = comment.id;
        this.content = comment.content;
        this.createdAt = comment.createdAt;
        this.updatedAt = comment.updatedAt;
        this.userId = comment.user?.id;
        this.userNickname = comment.user?.nickname;
        this.user = comment.user ? new UserResponseDto(comment.user) : undefined;
        this.postId = comment.post?.id;

        // 대댓글이 있는 경우 변환
        if (comment.replies && comment.replies.length > 0) {
            this.replies = comment.replies.map(reply => new ReplyResponseDto(reply));
        }
    }
} 