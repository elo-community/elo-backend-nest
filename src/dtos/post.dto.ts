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