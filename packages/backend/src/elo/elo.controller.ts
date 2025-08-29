import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreviewEloDto } from '../dtos/preview-elo.dto';
import { UserElo } from '../entities/user-elo.entity';
import { EloService } from './elo.service';

@ApiTags('Elo')
@Controller('elo')
export class EloController {
    constructor(
        private readonly eloService: EloService,
        @InjectRepository(UserElo)
        private readonly userEloRepository: Repository<UserElo>,
    ) { }

    @Post('preview')
    @ApiOperation({
        summary: 'Preview Elo rating calculation',
        description: 'Calculate Elo rating changes without persisting them to the database',
    })
    @ApiResponse({
        status: 200,
        description: 'Elo calculation preview',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                data: {
                    type: 'object',
                    properties: {
                        aOld: { type: 'number', format: 'decimal' },
                        aNew: { type: 'number', format: 'decimal' },
                        aDelta: { type: 'number', format: 'decimal' },
                        bOld: { type: 'number', format: 'decimal' },
                        bNew: { type: 'number', format: 'decimal' },
                        bDelta: { type: 'number', format: 'decimal' },
                        kEff: { type: 'number', format: 'decimal' },
                        h2hGap: { type: 'number' },
                        expectedA: { type: 'number', format: 'decimal' },
                        expectedB: { type: 'number', format: 'decimal' },
                    },
                },
                message: { type: 'string' },
            },
        },
    })
    async previewElo(@Body() previewDto: PreviewEloDto) {
        const { sportCategoryId, aId, bId, result, isHandicap = false } = previewDto;

        try {
            // 현재 rating 조회 또는 초기화
            const ratingA = await this.userEloRepository.findOne({
                where: { user: { id: aId }, sportCategory: { id: sportCategoryId } }
            });
            const ratingB = await this.userEloRepository.findOne({
                where: { user: { id: bId }, sportCategory: { id: sportCategoryId } }
            });

            // H2H gap 계산 (실제 매치 결과 기반)
            // 여기서는 간단한 계산을 위해 0으로 설정 (실제로는 매치 히스토리에서 계산)
            const h2hGap = 0;

            // Elo 계산
            const eloResult = this.eloService.calculateMatch(
                ratingA?.eloPoint || this.eloService.getInitialRating(),
                ratingB?.eloPoint || this.eloService.getInitialRating(),
                result,
                isHandicap,
                h2hGap
            );

            return {
                success: true,
                data: eloResult,
                message: 'Elo calculation preview completed successfully',
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: `Error calculating Elo: ${error.message}`,
            };
        }
    }

    @Get('user/:userId/sport/:sportCategoryId')
    @ApiOperation({
        summary: 'Get user Elo for specific sport',
        description: 'Get user Elo rating for a specific sport category. Returns null if not found.',
    })
    @ApiResponse({
        status: 200,
        description: 'User Elo information or null',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                data: {
                    oneOf: [
                        {
                            type: 'object',
                            properties: {
                                id: { type: 'number' },
                                eloPoint: { type: 'number' },
                                tier: { type: 'string' },
                                percentile: { type: 'number' },
                                wins: { type: 'number' },
                                losses: { type: 'number' },
                                draws: { type: 'number' },
                                totalMatches: { type: 'number' },
                                sportCategory: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'number' },
                                        name: { type: 'string' }
                                    }
                                }
                            }
                        },
                        { type: 'null' }
                    ]
                },
                message: { type: 'string' },
            },
        },
    })
    async getUserElo(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('sportCategoryId', ParseIntPipe) sportCategoryId: number
    ) {
        try {
            const userElo = await this.userEloRepository.findOne({
                where: { user: { id: userId }, sportCategory: { id: sportCategoryId } },
                relations: ['sportCategory']
            });

            return {
                success: true,
                data: userElo,
                message: userElo ? 'User Elo found' : 'User Elo not found for this sport',
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: `Error getting user Elo: ${error.message}`,
            };
        }
    }
} 