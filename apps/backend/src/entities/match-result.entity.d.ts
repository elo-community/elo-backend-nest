import { SportCategory } from './sport-category.entity';
import { User } from './user.entity';
export declare enum MatchStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export declare class MatchResult {
    id: number;
    user: User;
    partner?: User;
    sportCategory: SportCategory;
    senderResult?: 'win' | 'lose' | 'draw';
    isHandicap: boolean;
    status: MatchStatus;
    expiredTime: Date;
    createdAt: Date;
    playedAt: Date;
    playedDate: Date;
    confirmedAt?: Date;
    partnerResult: 'win' | 'lose' | 'draw';
    pairUserLo: number;
    pairUserHi: number;
    eloBefore?: number;
    eloAfter?: number;
    eloDelta?: number;
    partnerEloBefore?: number;
    partnerEloAfter?: number;
    partnerEloDelta?: number;
}
