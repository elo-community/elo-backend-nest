"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SportCategoryResponseDto = void 0;
class SportCategoryResponseDto {
    id;
    name;
    sortOrder;
    constructor(sportCategory) {
        this.id = sportCategory.id;
        this.name = sportCategory.name;
        this.sortOrder = sportCategory.sortOrder;
    }
}
exports.SportCategoryResponseDto = SportCategoryResponseDto;
//# sourceMappingURL=sport-category-response.dto.js.map