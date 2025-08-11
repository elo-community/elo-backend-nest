export class CreatePostDto {
    title?: string;
    content?: string;
    author?: any;
    sportCategoryId?: number | { id?: number; name?: string; sortOrder?: number };
    type?: string;
    isHidden?: boolean;
}

export class UpdatePostDto {
    title?: string;
    content?: string;
    type?: string;
    isHidden?: boolean;
    sportCategoryId?: number | { id?: number; name?: string; sortOrder?: number };
}

export class PostQueryDto {
    sport?: number;
    page?: number;
    limit?: number;
}

export class HotPostResponseDto {
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

    constructor(post: any) {
        this.id = post.id;
        this.title = post.title;
        this.content = post.content;
        this.author = post.author;
        this.sportCategory = post.sportCategory;
        this.popularityScore = post.popularityScore;
        this.createdAt = post.createdAt;
        this.viewCount = post.viewCount;
    }
}

export class HotPostsByCategoryDto {
    categoryId: number;
    categoryName: string;
    posts: HotPostResponseDto[];

    constructor(categoryId: number, categoryName: string, posts: any[]) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.posts = posts.map(post => new HotPostResponseDto(post));
    }
}