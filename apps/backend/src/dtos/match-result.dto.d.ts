export declare class CreateMatchResultDto {
    partnerNickname: string;
    sportCategoryId: number;
    senderResult: 'win' | 'lose' | 'draw';
    isHandicap?: boolean;
    playedAt: string | Date;
}
export declare class UpdateMatchResultDto {
    action: 'accept' | 'reject';
}
export declare class MatchResultResponseDto {
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
    partnerResult: 'win' | 'lose' | 'draw';
    constructor(matchResult: any);
}
