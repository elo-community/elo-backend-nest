import { Post } from '../entities/post.entity';
import { CommentResponseDto } from './comment-response.dto';
import { UserSimpleResponseDto } from './user-response.dto';
export declare class PostDetailResponseDto {
    id: number;
    title?: string;
    content?: string;
    type?: string;
    isHidden?: boolean;
    viewCount: number;
    commentCount: number;
    createdAt: Date;
    updatedAt: Date;
    author: UserSimpleResponseDto;
    sportCategoryId?: number;
    sportCategoryName?: string;
    comments: CommentResponseDto[];
    isLiked?: boolean;
    isHated?: boolean;
    likeCount: number;
    hateCount: number;
    imageUrls?: string[];
    constructor(post: Post, isLiked?: boolean, isHated?: boolean, likeCount?: number, hateCount?: number, userId?: number);
}
