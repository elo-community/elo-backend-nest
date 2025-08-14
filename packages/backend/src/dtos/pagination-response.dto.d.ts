export declare class PaginationResponseDto<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    constructor(data: T[], page: number, limit: number, total: number);
}
