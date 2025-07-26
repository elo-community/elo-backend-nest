import { Post } from '../entities/post.entity';
import { UserSimpleResponseDto } from './user-response.dto';

export class PostResponseDto {
    id: number;
    title?: string;
    content?: string;
    type?: string;
    isHidden?: boolean;
    createdAt: Date;
    updatedAt: Date;
    author?: UserSimpleResponseDto;
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
        this.author = post.author ? new UserSimpleResponseDto(post.author) : undefined;
        this.sportCategoryId = post.sportCategory?.id;
        this.sportCategoryName = post.sportCategory?.name;
    }
} 