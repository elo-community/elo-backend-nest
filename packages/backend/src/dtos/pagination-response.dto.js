"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationResponseDto = void 0;
class PaginationResponseDto {
    data;
    pagination;
    constructor(data, page, limit, total) {
        this.data = data;
        this.pagination = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
        };
    }
}
exports.PaginationResponseDto = PaginationResponseDto;
//# sourceMappingURL=pagination-response.dto.js.map