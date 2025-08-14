import { MatchResult } from './match-result.entity';
import { User } from './user.entity';
export declare class MatchResultHistory {
    id: number;
    matchResult: MatchResult;
    aUser: User;
    bUser: User;
    aOld: number;
    aNew: number;
    aDelta: number;
    bOld: number;
    bNew: number;
    bDelta: number;
    kEff: number;
    h2hGap: number;
    createdAt: Date;
}
