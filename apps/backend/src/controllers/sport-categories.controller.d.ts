import { SportCategoryResponseDto } from '../dtos/sport-category-response.dto';
import { CreateSportCategoryDto, SportCategoryQueryDto, UpdateSportCategoryDto } from '../dtos/sport-category.dto';
import { SportCategoryService } from '../services/sport-category.service';
export declare class SportCategoriesController {
    private readonly sportCategoryService;
    constructor(sportCategoryService: SportCategoryService);
    findAll(query: SportCategoryQueryDto): Promise<{
        success: boolean;
        data: SportCategoryResponseDto[];
        message: string;
    }>;
    findOne(id: number): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: SportCategoryResponseDto;
        message: string;
    }>;
    create(createSportCategoryDto: CreateSportCategoryDto): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: SportCategoryResponseDto;
        message: string;
    }>;
    createDefaultCategories(): Promise<{
        success: boolean;
        data: SportCategoryResponseDto[];
        message: string;
    }>;
    update(id: number, updateSportCategoryDto: UpdateSportCategoryDto): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: SportCategoryResponseDto;
        message: string;
    }>;
    remove(id: number): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            deleted: boolean;
        };
        message: string;
    }>;
}
