export class CreateReplyDto {
    content!: string;
    commentId!: number; // 대댓글을 달 댓글의 ID
}

export class UpdateReplyDto {
    content?: string;
}

export class ReplyQueryDto {
    commentId?: number; // 특정 댓글의 대댓글만 조회
} 