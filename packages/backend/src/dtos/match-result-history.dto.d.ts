export declare class MatchResultHistoryResponseDto {
    matches: MatchResultHistoryItemDto[];
}
export declare class MatchResultHistoryItemDto {
    id: number;
    partner: number;
    partner_nickname: string;
    sportCategory: string;
    result: 'win' | 'lose' | 'draw';
    isHandicap: boolean;
    created_at: Date;
    elo_before: number;
    elo_after: number;
    elo_delta: number;
}
export declare class MatchResultHistoryQueryDto {
    sport?: number;
    partner?: string;
    page?: number;
    limit?: number;
}
