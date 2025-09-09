export class CreateCommentDto {
  content!: string;
  postId!: number;
}

export class UpdateCommentDto {
  content?: string;
}

export class CommentQueryDto {
  postId?: number;
}
