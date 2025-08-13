export class MatchResultHistoryResponseDto {
    matches: MatchResultHistoryItemDto[];
}

export class MatchResultHistoryItemDto {
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

export class MatchResultHistoryQueryDto {
    sport?: number;
    partner?: string;
    page?: number;
    limit?: number;
} 