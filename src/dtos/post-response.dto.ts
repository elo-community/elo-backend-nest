import { Post } from '../entities/post.entity';

export class PostResponseDto {
    id: number;
    title?: string;
    content?: string;
    type?: string;
    isHidden?: boolean;
    createdAt: Date;
    updatedAt: Date;
    authorId: number;
    authorNickname?: string;
    sportCategoryId?: number;
    sportCategoryName?: string;

    constructor(post: Post) {
        this.id = post.id;
        this.title = post.title;
        this.content = post.content;
        this.type = post.type;
        this.isHidden = post.isHidden;
        this.createdAt = post.createdAt;
        this.updatedAt = post.updatedAt;
        this.authorId = post.author?.id;
        this.authorNickname = post.author?.nickname;
        this.sportCategoryId = post.sportCategory?.id;
        this.sportCategoryName = post.sportCategory?.name;
    }
} 