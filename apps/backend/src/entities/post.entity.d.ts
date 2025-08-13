import { Comment } from './comment.entity';
import { PostHate } from './post-hate.entity';
import { PostLike } from './post-like.entity';
import { SportCategory } from './sport-category.entity';
import { User } from './user.entity';
export declare class Post {
    id: number;
    author: User;
    content?: string;
    createdAt: Date;
    updatedAt: Date;
    title?: string;
    type?: string;
    isHidden?: boolean;
    viewCount: number;
    sportCategory?: SportCategory;
    comments?: Comment[];
    likes?: PostLike[];
    hates?: PostHate[];
    imageUrls?: string[];
}
