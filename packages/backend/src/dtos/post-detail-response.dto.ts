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
    comments: CommentResponseDto[];
    isLiked?: boolean;
    isHated?: boolean;
    likeCount: number;
    hateCount: number;
    imageUrls?: string[];

    // 매치글 관련 필드들
    matchLocation?: string;
    myElo?: number;
    preferredElo?: string;
    participantCount?: number;
    matchStatus?: string;
    deadline?: Date;
    matchDate?: Date;

    constructor(post: Post, isLiked?: boolean, isHated?: boolean, likeCount?: number, hateCount?: number, userId?: number) {
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
        this.imageUrls = post.imageUrls;

        // 매치글인 경우 매치 관련 정보 추가
        if (post.type === 'match') {
            this.matchLocation = post.matchLocation;
            this.myElo = post.myElo;
            this.preferredElo = post.preferredElo;
            this.participantCount = post.participantCount;
            this.matchStatus = post.matchStatus;
            this.deadline = post.deadline;
            this.matchDate = post.matchDate;
        }

        // 댓글이 있는 경우 변환, 없으면 빈 배열
        if (post.comments && post.comments.length > 0) {
            this.comments = post.comments.map(comment => new CommentResponseDto(comment, userId));
        } else {
            this.comments = [];
        }
    }
} 