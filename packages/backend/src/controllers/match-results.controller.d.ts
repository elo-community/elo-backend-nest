import { JwtUser } from '../auth/jwt-user.interface';
import { CreateMatchResultDto } from '../dtos/create-match-result.dto';
import { MatchResultResponseDto } from '../dtos/match-result.dto';
import { RespondMatchResultDto } from '../dtos/respond-match-result.dto';
import { MatchResultService } from '../services/match-result.service';
export declare class MatchResultsController {
    private readonly matchResultService;
    constructor(matchResultService: MatchResultService);
    create(createMatchResultDto: CreateMatchResultDto, user: JwtUser): Promise<{
        success: boolean;
        data: MatchResultResponseDto;
        message: string;
    }>;
    findSentRequests(user: JwtUser): Promise<{
        success: boolean;
        data: MatchResultResponseDto[];
        message: string;
    }>;
    findReceivedRequests(user: JwtUser): Promise<{
        success: boolean;
        data: MatchResultResponseDto[];
        message: string;
    }>;
    findOne(id: number, user: JwtUser): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: MatchResultResponseDto;
        message: string;
    }>;
    respond(id: number, respondDto: RespondMatchResultDto, user: JwtUser): Promise<{
        success: boolean;
        data: MatchResultResponseDto;
        message: string;
    }>;
}
export declare class UserMatchesController {
    private readonly matchResultService;
    constructor(matchResultService: MatchResultService);
    findUserMatches(userId: string, user: JwtUser): Promise<{
        success: boolean;
        data: MatchResultResponseDto[];
        message: string;
    }>;
}
