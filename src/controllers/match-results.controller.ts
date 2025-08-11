import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { CurrentUser } from '../auth/user.decorator';
import { CreateMatchResultDto, MatchResultResponseDto, ReceivedMatchResultResponseDto, SentMatchResultResponseDto } from '../dtos/match-result.dto';
import { RespondMatchResultDto } from '../dtos/respond-match-result.dto';
import { MatchResultService } from '../services/match-result.service';

@UseGuards(JwtAuthGuard)
@Controller('match-results')
export class MatchResultsController {
    constructor(
        private readonly matchResultService: MatchResultService,
    ) { }

    @Post()
    async create(@Body() createMatchResultDto: CreateMatchResultDto, @CurrentUser() user: JwtUser) {
        const matchResult = await this.matchResultService.create(createMatchResultDto, user);
        return {
            success: true,
            data: new MatchResultResponseDto(matchResult, user.id),
            message: 'Match request created successfully'
        };
    }

    @Get('sent')
    async findSentRequests(@CurrentUser() user: JwtUser) {
        const matchResults = await this.matchResultService.findSentRequests(user);

        return {
            success: true,
            data: matchResults.map(matchResult => new SentMatchResultResponseDto(matchResult)),
            message: 'Sent match requests retrieved successfully'
        };
    }

    @Get('received')
    async findReceivedRequests(@CurrentUser() user: JwtUser) {
        const matchResults = await this.matchResultService.findReceivedRequests(user);

        return {
            success: true,
            data: matchResults.map(matchResult => new ReceivedMatchResultResponseDto(matchResult)),
            message: 'Received match requests retrieved successfully'
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: number, @CurrentUser() user: JwtUser) {
        const matchResult = await this.matchResultService.findOne(id);

        if (!matchResult) {
            return {
                success: false,
                message: 'Match result not found'
            };
        }

        // 권한 확인: 매치 결과의 사용자이거나 파트너여야 함
        if (matchResult.user?.id !== user.id && matchResult.partner?.id !== user.id) {
            return {
                success: false,
                message: 'You do not have permission to view this match result'
            };
        }

        return {
            success: true,
            data: new MatchResultResponseDto(matchResult, user.id),
            message: 'Match result retrieved successfully'
        };
    }

    @Post(':id/respond')
    async respond(
        @Param('id') id: number,
        @Body() respondDto: RespondMatchResultDto,
        @CurrentUser() user: JwtUser
    ) {
        const matchResult = await this.matchResultService.respond(id, respondDto, user);

        return {
            success: true,
            data: new MatchResultResponseDto(matchResult, user.id),
            message: `Match request ${respondDto.action}ed successfully`
        };
    }
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserMatchesController {
    constructor(
        private readonly matchResultService: MatchResultService,
    ) { }

    @Get(':userId/matches')
    async findUserMatches(@Param('userId') userId: string, @CurrentUser() user: JwtUser) {
        // 'me'인 경우 현재 사용자의 매치 결과 조회
        const targetUserId = userId === 'me' ? user.id : parseInt(userId);

        const matchResults = await this.matchResultService.findByUserId(targetUserId);

        return {
            success: true,
            data: matchResults.map(matchResult => new MatchResultResponseDto(matchResult, user.id)),
            message: 'User matches retrieved successfully'
        };
    }
} 