export declare class UserEloResponseDto {
    id: number;
    sportCategory: {
        id: number;
        name: string;
    };
    eloPoint: number;
    tier: string;
    percentile: number;
    constructor(userElo: any);
}
