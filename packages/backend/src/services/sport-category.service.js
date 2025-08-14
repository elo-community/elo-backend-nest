"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SportCategoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sport_category_entity_1 = require("../entities/sport-category.entity");
let SportCategoryService = class SportCategoryService {
    sportCategoryRepository;
    constructor(sportCategoryRepository) {
        this.sportCategoryRepository = sportCategoryRepository;
    }
    async createDefaultCategories() {
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
    async findAll(query) {
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
    async findOne(id) {
        return this.sportCategoryRepository.findOne({ where: { id } });
    }
    async create(createSportCategoryDto) {
        const sportCategory = this.sportCategoryRepository.create(createSportCategoryDto);
        return this.sportCategoryRepository.save(sportCategory);
    }
    async update(id, updateSportCategoryDto) {
        await this.sportCategoryRepository.update(id, updateSportCategoryDto);
        return this.sportCategoryRepository.findOne({ where: { id } });
    }
    async remove(id) {
        return this.sportCategoryRepository.delete(id);
    }
    async findByName(name) {
        return this.sportCategoryRepository.findOne({ where: { name } });
    }
};
exports.SportCategoryService = SportCategoryService;
exports.SportCategoryService = SportCategoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sport_category_entity_1.SportCategory)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SportCategoryService);
//# sourceMappingURL=sport-category.service.js.map