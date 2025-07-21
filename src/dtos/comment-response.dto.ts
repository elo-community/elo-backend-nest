import { Comment } from '../entities/comment.entity';

export class CommentResponseDto {
    id: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    userNickname?: string;
    postId: number;

    constructor(comment: Comment) {
        this.id = comment.id;
        this.content = comment.content;
        this.createdAt = comment.createdAt;
        this.updatedAt = comment.updatedAt;
        this.userId = comment.user?.id;
        this.userNickname = comment.user?.nickname;
        this.postId = comment.post?.id;
    }
} 