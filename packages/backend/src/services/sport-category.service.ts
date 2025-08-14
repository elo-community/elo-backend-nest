import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { CreateSportCategoryDto, SportCategoryQueryDto, UpdateSportCategoryDto } from '../dtos/sport-category.dto';
import { SportCategory } from '../entities/sport-category.entity';

@Injectable()
export class SportCategoryService {
    constructor(
        @InjectRepository(SportCategory)
        private readonly sportCategoryRepository: Repository<SportCategory>,
    ) { }

    async createDefaultCategories(): Promise<void> {
        const defaultCategories = [
            { name: '자유글', sortOrder: 1 },
            { name: '테니스', sortOrder: 2 },
            { name: '배드민턴', sortOrder: 3 },
            { name: '탁구', sortOrder: 4 },
            { name: '당구', sortOrder: 5 },
            { name: '바둑', sortOrder: 6 },
            { name: '체스', sortOrder: 7 },
            { name: '공지사항', sortOrder: 8 }
        ];

        for (const category of defaultCategories) {
            const existingCategory = await this.findByName(category.name);
            if (!existingCategory) {
                await this.create(category);
            }
        }
    }

    async findAll(query?: SportCategoryQueryDto): Promise<SportCategory[]> {
        const queryBuilder = this.sportCategoryRepository.createQueryBuilder('sportCategory');

        if (query?.name) {
            queryBuilder.andWhere('sportCategory.name ILIKE :name', { name: `%${query.name}%` });
        }

        if (query?.sortOrder !== undefined) {
            queryBuilder.andWhere('sportCategory.sortOrder = :sortOrder', { sortOrder: query.sortOrder });
        }

        queryBuilder.orderBy('sportCategory.sortOrder', 'ASC');
        queryBuilder.addOrderBy('sportCategory.name', 'ASC');

        return queryBuilder.getMany();
    }

    async findOne(id: number): Promise<SportCategory | null> {
        return this.sportCategoryRepository.findOne({ where: { id } });
    }

    async create(createSportCategoryDto: CreateSportCategoryDto): Promise<SportCategory> {
        const sportCategory = this.sportCategoryRepository.create(createSportCategoryDto);
        return this.sportCategoryRepository.save(sportCategory);
    }

    async update(id: number, updateSportCategoryDto: UpdateSportCategoryDto): Promise<SportCategory | null> {
        await this.sportCategoryRepository.update(id, updateSportCategoryDto);
        return this.sportCategoryRepository.findOne({ where: { id } });
    }

    async remove(id: number): Promise<DeleteResult> {
        return this.sportCategoryRepository.delete(id);
    }

    async findByName(name: string): Promise<SportCategory | null> {
        return this.sportCategoryRepository.findOne({ where: { name } });
    }
} 