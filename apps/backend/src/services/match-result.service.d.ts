import { DataSource, Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { CreateMatchResultDto } from '../dtos/create-match-result.dto';
import { RespondMatchResultDto } from '../dtos/respond-match-result.dto';
import { EloService } from '../elo/elo.service';
import { MatchResultHistory } from '../entities/match-result-history.entity';
import { MatchResult } from '../entities/match-result.entity';
import { SportCategory } from '../entities/sport-category.entity';
import { UserElo } from '../entities/user-elo.entity';
import { User } from '../entities/user.entity';
import { SseService } from './sse.service';
export declare class MatchResultService {
    private readonly matchResultRepository;
    private readonly matchResultHistoryRepository;
    private readonly sportCategoryRepository;
    private readonly userRepository;
    private readonly userEloRepository;
    private readonly sseService;
    private readonly eloService;
    private readonly dataSource;
    constructor(matchResultRepository: Repository<MatchResult>, matchResultHistoryRepository: Repository<MatchResultHistory>, sportCategoryRepository: Repository<SportCategory>, userRepository: Repository<User>, userEloRepository: Repository<UserElo>, sseService: SseService, eloService: EloService, dataSource: DataSource);
    create(createMatchResultDto: CreateMatchResultDto, user: JwtUser): Promise<MatchResult>;
    findSentRequests(user: JwtUser): Promise<MatchResult[]>;
    findReceivedRequests(user: JwtUser): Promise<MatchResult[]>;
    findOne(id: number): Promise<MatchResult | null>;
    cleanupExpiredRequests(): Promise<void>;
    respond(matchResultId: number, respondDto: RespondMatchResultDto, user: JwtUser): Promise<MatchResult>;
    h2hGap(sportCategoryId: number, aId: number, bId: number): Promise<number>;
    private applyEloToMatch;
    findByUserId(userId: number): Promise<MatchResult[]>;
    findUserMatchHistory(user: JwtUser, query?: any): Promise<{
        data: any[];
        pagination: any;
    }>;
}
