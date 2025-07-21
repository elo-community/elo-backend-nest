export class CreateCommentDto {
    content!: string;
    user!: any;
    post!: any;
}

export class UpdateCommentDto {
    content?: string;
} 