export declare class CreatePostDto {
    title?: string;
    content?: string;
    author?: any;
    sportCategoryId?: number | {
        id?: number;
        name?: string;
        sortOrder?: number;
    };
    type?: string;
    isHidden?: boolean;
}
export declare class UpdatePostDto {
    title?: string;
    content?: string;
    type?: string;
    isHidden?: boolean;
    sportCategoryId?: number | {
        id?: number;
        name?: string;
        sortOrder?: number;
    };
}
export declare class PostQueryDto {
    sport?: number;
    page?: number;
    limit?: number;
}
export declare class HotPostResponseDto {
    id: number;
    title: string;
    content: string;
    author: {
        id: number;
        nickname: string;
    };
    sportCategory: {
        id: number;
        name: string;
    };
    popularityScore: number;
    createdAt: Date;
    viewCount: number;
    rank?: number;
    selectionDate?: Date;
    isRewarded?: boolean;
    constructor(post: any);
}
export declare class HotPostsByCategoryDto {
    categoryId: number;
    categoryName: string;
    posts: HotPostResponseDto[];
    constructor(categoryId: number, categoryName: string, posts: any[]);
}
