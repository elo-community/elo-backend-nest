import { SportCategory } from '../entities/sport-category.entity';
export declare class SportCategoryResponseDto {
    id: number;
    name?: string;
    sortOrder?: number;
    constructor(sportCategory: SportCategory);
}
