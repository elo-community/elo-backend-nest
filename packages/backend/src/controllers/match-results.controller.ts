import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { CurrentUser } from '../auth/user.decorator';
import { CreateMatchResultDto } from '../dtos/create-match-result.dto';
import { MatchResultResponseDto } from '../dtos/match-result.dto';
import { RespondMatchResultDto } from '../dtos/respond-match-result.dto';
import { MatchResultService } from '../services/match-result.service';

@ApiTags('match-results')
@UseGuards(JwtAuthGuard)
@Controller('match-results')
export class MatchResultsController {
    constructor(
        private readonly matchResultService: MatchResultService,
    ) { }

    @Post()
    @ApiOperation({ summary: '매치 결과 생성', description: '새로운 매치 결과를 생성합니다.' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                partnerId: {
                    type: 'number',
                    description: '상대방 사용자 ID',
                    example: 2
                },
                sportCategoryId: {
                    type: 'number',
                    description: '스포츠 카테고리 ID',
                    example: 1
                },
                userScore: {
                    type: 'number',
                    description: '사용자 점수',
                    example: 21
                },
                partnerScore: {
                    type: 'number',
                    description: '상대방 점수',
                    example: 19
                },
                matchDate: {
                    type: 'string',
                    format: 'date',
                    description: '매치 날짜',
                    example: '2024-01-15'
                },
                notes: {
                    type: 'string',
                    description: '매치 노트',
                    example: '정말 재미있는 게임이었습니다!'
                }
            },
            required: ['partnerId', 'sportCategoryId', 'userScore', 'partnerScore', 'matchDate']
        }
    })
    @ApiResponse({ status: 201, description: '매치 결과 생성 성공' })
    @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
    @ApiResponse({ status: 401, description: '인증 실패' })
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
            data: new MatchResultResponseDto(matchResult),
            message: 'Match result retrieved successfully'
        };
    }

    @Post(':id/respond')
    @ApiOperation({ summary: '매치 결과 응답', description: '매치 결과에 대한 응답을 처리합니다.' })
    @ApiParam({ name: 'id', description: '매치 결과 ID', example: 1 })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                action: {
                    type: 'string',
                    enum: ['accept', 'reject'],
                    description: '응답 액션',
                    example: 'accept'
                },
                notes: {
                    type: 'string',
                    description: '응답 노트',
                    example: '매치 결과를 확인했습니다.'
                }
            },
            required: ['action']
        }
    })
    @ApiResponse({ status: 200, description: '매치 결과 응답 성공' })
    @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async respond(
        @Param('id') id: number,
        @Body() respondDto: RespondMatchResultDto,
        @CurrentUser() user: JwtUser
    ) {
        const matchResult = await this.matchResultService.respond(id, respondDto, user);

        return {
            success: true,
            data: new MatchResultResponseDto(matchResult),
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
            data: matchResults.map(matchResult => new MatchResultResponseDto(matchResult)),
            message: 'User matches retrieved successfully'
        };
    }
} 