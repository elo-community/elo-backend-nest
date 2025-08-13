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
exports.SportCategoriesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const public_decorator_1 = require("../auth/public.decorator");
const sport_category_response_dto_1 = require("../dtos/sport-category-response.dto");
const sport_category_dto_1 = require("../dtos/sport-category.dto");
const sport_category_service_1 = require("../services/sport-category.service");
let SportCategoriesController = class SportCategoriesController {
    sportCategoryService;
    constructor(sportCategoryService) {
        this.sportCategoryService = sportCategoryService;
    }
    async findAll(query) {
        const sportCategories = await this.sportCategoryService.findAll(query);
        return {
            success: true,
            data: sportCategories.map((sportCategory) => new sport_category_response_dto_1.SportCategoryResponseDto(sportCategory)),
            message: 'Sport categories retrieved successfully'
        };
    }
    async findOne(id) {
        const sportCategory = await this.sportCategoryService.findOne(id);
        if (!sportCategory) {
            return {
                success: false,
                message: 'Sport category not found'
            };
        }
        return {
            success: true,
            data: new sport_category_response_dto_1.SportCategoryResponseDto(sportCategory),
            message: 'Sport category retrieved successfully'
        };
    }
    async create(createSportCategoryDto) {
        const existingCategory = await this.sportCategoryService.findByName(createSportCategoryDto.name);
        if (existingCategory) {
            return {
                success: false,
                message: 'Sport category with this name already exists'
            };
        }
        const sportCategory = await this.sportCategoryService.create(createSportCategoryDto);
        return {
            success: true,
            data: new sport_category_response_dto_1.SportCategoryResponseDto(sportCategory),
            message: 'Sport category created successfully'
        };
    }
    async createDefaultCategories() {
        await this.sportCategoryService.createDefaultCategories();
        const sportCategories = await this.sportCategoryService.findAll();
        return {
            success: true,
            data: sportCategories.map((sportCategory) => new sport_category_response_dto_1.SportCategoryResponseDto(sportCategory)),
            message: 'Default sport categories created successfully'
        };
    }
    async update(id, updateSportCategoryDto) {
        const existingCategory = await this.sportCategoryService.findOne(id);
        if (!existingCategory) {
            return {
                success: false,
                message: 'Sport category not found'
            };
        }
        if (updateSportCategoryDto.name && updateSportCategoryDto.name !== existingCategory.name) {
            const duplicateCategory = await this.sportCategoryService.findByName(updateSportCategoryDto.name);
            if (duplicateCategory) {
                return {
                    success: false,
                    message: 'Sport category with this name already exists'
                };
            }
        }
        const sportCategory = await this.sportCategoryService.update(id, updateSportCategoryDto);
        if (!sportCategory) {
            return {
                success: false,
                message: 'Sport category not found'
            };
        }
        return {
            success: true,
            data: new sport_category_response_dto_1.SportCategoryResponseDto(sportCategory),
            message: 'Sport category updated successfully'
        };
    }
    async remove(id) {
        const existingCategory = await this.sportCategoryService.findOne(id);
        if (!existingCategory) {
            return {
                success: false,
                message: 'Sport category not found'
            };
        }
        const result = await this.sportCategoryService.remove(id);
        return {
            success: true,
            data: { deleted: !!result.affected },
            message: 'Sport category deleted successfully'
        };
    }
};
exports.SportCategoriesController = SportCategoriesController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sport_category_dto_1.SportCategoryQueryDto]),
    __metadata("design:returntype", Promise)
], SportCategoriesController.prototype, "findAll", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SportCategoriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sport_category_dto_1.CreateSportCategoryDto]),
    __metadata("design:returntype", Promise)
], SportCategoriesController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('create-defaults'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SportCategoriesController.prototype, "createDefaultCategories", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, sport_category_dto_1.UpdateSportCategoryDto]),
    __metadata("design:returntype", Promise)
], SportCategoriesController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SportCategoriesController.prototype, "remove", null);
exports.SportCategoriesController = SportCategoriesController = __decorate([
    (0, common_1.Controller)('sport-categories'),
    __metadata("design:paramtypes", [sport_category_service_1.SportCategoryService])
], SportCategoriesController);
//# sourceMappingURL=sport-categories.controller.js.map