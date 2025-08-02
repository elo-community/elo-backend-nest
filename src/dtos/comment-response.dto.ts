import { Comment } from '../entities/comment.entity';
import { ReplyResponseDto } from './reply-response.dto';
import { UserSimpleResponseDto } from './user-response.dto';

export class CommentResponseDto {
    id: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    user?: UserSimpleResponseDto;
    postId: number;
    replies: ReplyResponseDto[];
    likeCount: number;
    isLiked?: boolean;

    constructor(comment: Comment, userId?: number) {
        this.id = comment.id;
        this.content = comment.content;
        this.createdAt = comment.createdAt;
        this.updatedAt = comment.updatedAt;
        this.user = comment.user ? new UserSimpleResponseDto(comment.user) : undefined;
        this.postId = comment.post?.id;
        this.likeCount = comment.likes?.length || 0;

        // 사용자가 좋아요를 눌렀는지 확인 (기본값: false)
        if (userId && comment.likes) {
            this.isLiked = comment.likes.some(like => like.user?.id === userId && like.isLiked === true);
        } else {
            this.isLiked = false;
        }

        // 대댓글이 있는 경우 변환, 없으면 빈 배열
        if (comment.replies && comment.replies.length > 0) {
            this.replies = comment.replies.map(reply => new ReplyResponseDto(reply));
        } else {
            this.replies = [];
        }
    }
} 