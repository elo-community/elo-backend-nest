export declare class CreateMatchResultDto {
    sportCategoryId: number;
    partnerNickname: string;
    senderResult: 'win' | 'lose' | 'draw';
    isHandicap?: boolean;
    playedAt?: string | Date;
}
