export class CreatePostDto {
    title?: string;
    content?: string;
    author?: any;
    sportCategory?: number | { id?: number; name?: string; sortOrder?: number };
    type?: string;
    isHidden?: boolean;
}

export class UpdatePostDto {
    title?: string;
    content?: string;
    type?: string;
    isHidden?: boolean;
    sportCategory?: number | { id?: number; name?: string; sortOrder?: number };
} 