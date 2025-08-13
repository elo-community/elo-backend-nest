import { DeleteResult, Repository } from 'typeorm';
import { CreateSportCategoryDto, SportCategoryQueryDto, UpdateSportCategoryDto } from '../dtos/sport-category.dto';
import { SportCategory } from '../entities/sport-category.entity';
export declare class SportCategoryService {
    private readonly sportCategoryRepository;
    constructor(sportCategoryRepository: Repository<SportCategory>);
    createDefaultCategories(): Promise<void>;
    findAll(query?: SportCategoryQueryDto): Promise<SportCategory[]>;
    findOne(id: number): Promise<SportCategory | null>;
    create(createSportCategoryDto: CreateSportCategoryDto): Promise<SportCategory>;
    update(id: number, updateSportCategoryDto: UpdateSportCategoryDto): Promise<SportCategory | null>;
    remove(id: number): Promise<DeleteResult>;
    findByName(name: string): Promise<SportCategory | null>;
}
