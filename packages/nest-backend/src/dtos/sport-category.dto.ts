export class CreateSportCategoryDto {
    name!: string;
    sortOrder?: number;
}

export class UpdateSportCategoryDto {
    name?: string;
    sortOrder?: number;
}

export class SportCategoryQueryDto {
    name?: string;
    sortOrder?: number;
} 