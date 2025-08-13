import { MatchResultService } from '../services/match-result.service';
export declare class MatchResultScheduler {
    private readonly matchResultService;
    private readonly logger;
    constructor(matchResultService: MatchResultService);
    cleanupExpiredRequests(): Promise<void>;
}
