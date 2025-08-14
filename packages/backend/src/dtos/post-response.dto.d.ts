import { Post } from '../entities/post.entity';
import { UserSimpleResponseDto } from './user-response.dto';
export declare class PostResponseDto {
    id: number;
    title?: string;
    content?: string;
    type?: string;
    isHidden?: boolean;
    viewCount: number;
    commentCount: number;
    createdAt: Date;
    updatedAt: Date;
    author?: UserSimpleResponseDto;
    sportCategoryId?: number;
    sportCategoryName?: string;
    isLiked?: boolean;
    isHated?: boolean;
    likeCount: number;
    hateCount: number;
    imageUrls?: string[];
    constructor(post: Post, isLiked?: boolean, isHated?: boolean, likeCount?: number, hateCount?: number);
}
