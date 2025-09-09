import { SportCategory } from '../entities/sport-category.entity';

export class SportCategoryResponseDto {
  id: number;
  name?: string;
  sortOrder?: number;

  constructor(sportCategory: SportCategory) {
    this.id = sportCategory.id;
    this.name = sportCategory.name;
    this.sortOrder = sportCategory.sortOrder;
  }
}
