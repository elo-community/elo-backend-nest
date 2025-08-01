import { Post } from '../entities/post.entity';
import { CommentResponseDto } from './comment-response.dto';
import { UserSimpleResponseDto } from './user-response.dto';

export class PostDetailResponseDto {
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
    comments?: CommentResponseDto[];
    isLiked?: boolean;
    isHated?: boolean;
    likeCount: number;
    hateCount: number;

    constructor(post: Post, isLiked?: boolean, isHated?: boolean, likeCount?: number, hateCount?: number) {
        this.id = post.id;
        this.title = post.title;
        this.content = post.content;
        this.type = post.type;
        this.isHidden = post.isHidden;
        this.viewCount = post.viewCount;
        this.commentCount = post.comments?.length || 0;
        this.createdAt = post.createdAt;
        this.updatedAt = post.updatedAt;
        this.author = new UserSimpleResponseDto(post.author);
        this.sportCategoryId = post.sportCategory?.id;
        this.sportCategoryName = post.sportCategory?.name;
        this.isLiked = isLiked;
        this.isHated = isHated;
        this.likeCount = likeCount || 0;
        this.hateCount = hateCount || 0;

        // 댓글이 있는 경우 변환
        if (post.comments && post.comments.length > 0) {
            this.comments = post.comments.map(comment => new CommentResponseDto(comment));
        }
    }
} 