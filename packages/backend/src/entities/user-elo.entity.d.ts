import { SportCategory } from './sport-category.entity';
import { User } from './user.entity';
export declare class UserElo {
    id: number;
    sportCategory: SportCategory;
    user: User;
    eloPoint: number;
    tier: string;
    percentile: number;
    wins: number;
    losses: number;
    draws: number;
    totalMatches: number;
}
