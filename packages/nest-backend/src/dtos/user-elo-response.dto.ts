export class UserEloResponseDto {
    id: number;
    sportCategory: {
        id: number;
        name: string;
    };
    eloPoint: number;
    tier: string;
    percentile: number;

    constructor(userElo: any) {
        this.id = userElo.id;
        this.sportCategory = {
            id: userElo.sportCategory.id,
            name: userElo.sportCategory.name
        };
        this.eloPoint = userElo.eloPoint;
        this.tier = userElo.tier;
        this.percentile = userElo.percentile;
    }
} 