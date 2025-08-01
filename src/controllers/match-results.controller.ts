import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { CurrentUser } from '../auth/user.decorator';
import { CreateMatchResultDto, MatchResultResponseDto, UpdateMatchResultDto } from '../dtos/match-result.dto';
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
            data: new MatchResultResponseDto(matchResult),
            message: 'Match request created successfully'
        };
    }

    @Get('sent')
    async findSentRequests(@CurrentUser() user: JwtUser) {
        const matchResults = await this.matchResultService.findSentRequests(user);

        return {
            success: true,
            data: matchResults.map(matchResult => new MatchResultResponseDto(matchResult)),
            message: 'Sent match requests retrieved successfully'
        };
    }

    @Get('received')
    async findReceivedRequests(@CurrentUser() user: JwtUser) {
        const matchResults = await this.matchResultService.findReceivedRequests(user);

        return {
            success: true,
            data: matchResults.map(matchResult => new MatchResultResponseDto(matchResult)),
            message: 'Received match requests retrieved successfully'
        };
    }

    @Put(':id')
    async updateStatus(
        @Param('id') id: number,
        @Body() updateMatchResultDto: UpdateMatchResultDto,
        @CurrentUser() user: JwtUser
    ) {
        const matchResult = await this.matchResultService.updateStatus(id, updateMatchResultDto.action, user);

        return {
            success: true,
            data: new MatchResultResponseDto(matchResult),
            message: `Match request ${updateMatchResultDto.action}ed successfully`
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
            data: matchResults.map(matchResult => new MatchResultResponseDto(matchResult)),
            message: 'User matches retrieved successfully'
        };
    }
} 