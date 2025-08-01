export class CreateMatchResultDto {
    partnerNickname: string;
    sportCategoryId: number;
    myResult?: 'win' | 'lose' | 'draw';
    isHandicap?: boolean;
}

export class UpdateMatchResultDto {
    action: 'accept' | 'reject';
}

export class MatchResultResponseDto {
    id: number;
    partnerId?: number;
    partnerNickname?: string;
    sportCategoryId: number;
    sportCategoryName: string;
    myResult?: 'win' | 'lose' | 'draw';
    isHandicap: boolean;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    expiredTime: Date;
    createdAt: Date;

    constructor(matchResult: any) {
        this.id = matchResult.id;
        this.partnerId = matchResult.partner?.id;
        this.partnerNickname = matchResult.partner?.nickname;
        this.sportCategoryId = matchResult.sportCategory.id;
        this.sportCategoryName = matchResult.sportCategory.name;
        this.myResult = matchResult.myResult;
        this.isHandicap = matchResult.isHandicap;
        this.status = matchResult.status;
        this.expiredTime = matchResult.expiredTime;
        this.createdAt = matchResult.createdAt;
    }
} 