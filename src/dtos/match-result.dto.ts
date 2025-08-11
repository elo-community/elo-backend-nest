export class CreateMatchResultDto {
    partnerNickname: string;
    sportCategoryId: number;
    senderResult: 'win' | 'lose' | 'draw';
    isHandicap?: boolean;
    playedAt: string | Date;
}

export class UpdateMatchResultDto {
    action: 'accept' | 'reject';
}

// 통합된 DTO (보낸 사람/받은 사람 모두 처리)
export class MatchResultResponseDto {
    id: number;
    partnerId: number;
    partnerNickname: string;
    senderId: number;
    senderNickname: string;
    sportCategoryId: number;
    sportCategoryName: string;
    senderResult: 'win' | 'lose' | 'draw';
    isHandicap: boolean;
    status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
    expiredTime: Date;
    createdAt: Date;
    playedAt: Date;
    playedDate: Date;
    confirmedAt?: Date;
    partnerResult?: 'win' | 'lose' | 'draw';

    constructor(matchResult: any) {
        this.id = matchResult.id;
        this.sportCategoryId = matchResult.sportCategory.id;
        this.sportCategoryName = matchResult.sportCategory.name;

        // 항상 sender와 partner 정보를 그대로 표시
        this.senderId = matchResult.user?.id;
        this.senderNickname = matchResult.user?.nickname;
        this.partnerId = matchResult.partner?.id;
        this.partnerNickname = matchResult.partner?.nickname;

        // 결과도 그대로 표시 (변환 없음)
        this.senderResult = matchResult.senderResult;
        this.partnerResult = matchResult.partnerResult;

        this.isHandicap = matchResult.isHandicap;
        this.status = matchResult.status;
        this.expiredTime = matchResult.expiredTime;
        this.createdAt = matchResult.createdAt;
        this.playedAt = matchResult.playedAt;
        this.playedDate = matchResult.playedDate;
        this.confirmedAt = matchResult.confirmedAt;
    }
} 