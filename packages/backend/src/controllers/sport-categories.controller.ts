import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { SportCategoryResponseDto } from '../dtos/sport-category-response.dto';
import {
  CreateSportCategoryDto,
  SportCategoryQueryDto,
  UpdateSportCategoryDto,
} from '../dtos/sport-category.dto';
import { SportCategoryService } from '../services/sport-category.service';

@Controller('sport-categories')
export class SportCategoriesController {
  constructor(private readonly sportCategoryService: SportCategoryService) {}

  @Public()
  @Get()
  async findAll(@Query() query: SportCategoryQueryDto) {
    const sportCategories = await this.sportCategoryService.findAll(query);
    return {
      success: true,
      data: sportCategories.map(sportCategory => new SportCategoryResponseDto(sportCategory)),
      message: 'Sport categories retrieved successfully',
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: number) {
    const sportCategory = await this.sportCategoryService.findOne(id);
    if (!sportCategory) {
      return {
        success: false,
        message: 'Sport category not found',
      };
    }
    return {
      success: true,
      data: new SportCategoryResponseDto(sportCategory),
      message: 'Sport category retrieved successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createSportCategoryDto: CreateSportCategoryDto) {
    // 중복 이름 체크
    const existingCategory = await this.sportCategoryService.findByName(
      createSportCategoryDto.name,
    );
    if (existingCategory) {
      return {
        success: false,
        message: 'Sport category with this name already exists',
      };
    }

    const sportCategory = await this.sportCategoryService.create(createSportCategoryDto);
    return {
      success: true,
      data: new SportCategoryResponseDto(sportCategory),
      message: 'Sport category created successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-defaults')
  async createDefaultCategories() {
    await this.sportCategoryService.createDefaultCategories();
    const sportCategories = await this.sportCategoryService.findAll();
    return {
      success: true,
      data: sportCategories.map(sportCategory => new SportCategoryResponseDto(sportCategory)),
      message: 'Default sport categories created successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: number, @Body() updateSportCategoryDto: UpdateSportCategoryDto) {
    const existingCategory = await this.sportCategoryService.findOne(id);
    if (!existingCategory) {
      return {
        success: false,
        message: 'Sport category not found',
      };
    }

    // 이름이 변경되는 경우 중복 체크
    if (updateSportCategoryDto.name && updateSportCategoryDto.name !== existingCategory.name) {
      const duplicateCategory = await this.sportCategoryService.findByName(
        updateSportCategoryDto.name,
      );
      if (duplicateCategory) {
        return {
          success: false,
          message: 'Sport category with this name already exists',
        };
      }
    }

    const sportCategory = await this.sportCategoryService.update(id, updateSportCategoryDto);
    if (!sportCategory) {
      return {
        success: false,
        message: 'Sport category not found',
      };
    }
    return {
      success: true,
      data: new SportCategoryResponseDto(sportCategory),
      message: 'Sport category updated successfully',
    };
  }

  // @UseGuards(JwtAuthGuard)
  // @Delete(':id')
  // async remove(@Param('id') id: number) {
  //     const existingCategory = await this.sportCategoryService.findOne(id);
  //     if (!existingCategory) {
  //         return {
  //             success: false,
  //             message: 'Sport category not found'
  //         };
  //     }

  //     const result = await this.sportCategoryService.remove(id);
  //     return {
  //         success: true,
  //         data: { deleted: !!result.affected },
  //         message: 'Sport category deleted successfully'
  //     };
  // }
}
