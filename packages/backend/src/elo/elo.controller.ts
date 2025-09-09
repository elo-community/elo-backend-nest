import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  ) {}

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
        where: { user: { id: aId }, sportCategory: { id: sportCategoryId } },
      });
      const ratingB = await this.userEloRepository.findOne({
        where: { user: { id: bId }, sportCategory: { id: sportCategoryId } },
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
        h2hGap,
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
                    name: { type: 'string' },
                  },
                },
              },
            },
            { type: 'null' },
          ],
        },
        message: { type: 'string' },
      },
    },
  })
  async getUserElo(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('sportCategoryId', ParseIntPipe) sportCategoryId: number,
  ) {
    try {
      const userElo = await this.userEloRepository.findOne({
        where: { user: { id: userId }, sportCategory: { id: sportCategoryId } },
        relations: ['sportCategory'],
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

  @Get('test')
  async test() {
    return { message: 'Test endpoint works!' };
  }

  @Get('ranking/sport/:sportCategoryId')
  @ApiOperation({
    summary: 'Get ELO ranking by sport category',
    description: 'Get ELO ranking for a specific sport category with match count information',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of top players to return (default: 50, max: 100)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of players to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'ELO ranking for the sport category',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            sportCategory: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
              },
            },
            ranking: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  rank: { type: 'number' },
                  userId: { type: 'number' },
                  nickname: { type: 'string' },
                  eloPoint: { type: 'number' },
                  tier: { type: 'string' },
                  percentile: { type: 'number' },
                  wins: { type: 'number' },
                  losses: { type: 'number' },
                  draws: { type: 'number' },
                  totalMatches: { type: 'number' },
                  winRate: { type: 'number', format: 'decimal' },
                },
              },
            },
            totalCount: { type: 'number' },
            pagination: {
              type: 'object',
              properties: {
                limit: { type: 'number' },
                offset: { type: 'number' },
                hasMore: { type: 'boolean' },
              },
            },
          },
        },
        message: { type: 'string' },
      },
    },
  })
  async getSportRanking(
    @Param('sportCategoryId', ParseIntPipe) sportCategoryId: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    try {
      // 기본값 설정
      const limitValue = Math.min(limit || 50, 100); // 최대 100개
      const offsetValue = offset || 0;

      // 랭킹 조회 (ELO 점수 내림차순, 경기 수 내림차순)
      const [userElos, totalCount] = await this.userEloRepository.findAndCount({
        where: { sportCategory: { id: sportCategoryId } },
        relations: ['user', 'sportCategory'],
        order: {
          eloPoint: 'DESC',
          totalMatches: 'DESC',
        },
        take: limitValue,
        skip: offsetValue,
      });

      // 랭킹 데이터 구성
      const ranking = userElos.map((userElo, index) => {
        const winRate = userElo.totalMatches > 0 ? (userElo.wins / userElo.totalMatches) * 100 : 0;

        return {
          rank: offsetValue + index + 1,
          userId: userElo.user.id,
          nickname: userElo.user.nickname,
          eloPoint: userElo.eloPoint,
          tier: userElo.tier,
          percentile: userElo.percentile,
          wins: userElo.wins,
          losses: userElo.losses,
          draws: userElo.draws,
          totalMatches: userElo.totalMatches,
          winRate: Math.round(winRate * 100) / 100, // 소수점 2자리
        };
      });

      const sportCategory = userElos.length > 0 ? userElos[0].sportCategory : null;

      return {
        success: true,
        data: {
          sportCategory: sportCategory
            ? {
                id: sportCategory.id,
                name: sportCategory.name,
              }
            : null,
          ranking,
          totalCount,
          pagination: {
            limit: limitValue,
            offset: offsetValue,
            hasMore: offsetValue + limitValue < totalCount,
          },
        },
        message: `Found ${userElos.length} players in ranking`,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Error getting sport ranking: ${error.message}`,
      };
    }
  }

  @Get('ranking/overall')
  @ApiOperation({
    summary: 'Get overall ELO ranking across all sports',
    description: 'Get overall ELO ranking across all sports with match count information',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of top players to return (default: 50, max: 100)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of players to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Overall ELO ranking across all sports',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            ranking: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  rank: { type: 'number' },
                  userId: { type: 'number' },
                  nickname: { type: 'string' },
                  averageElo: { type: 'number' },
                  totalMatches: { type: 'number' },
                  totalWins: { type: 'number' },
                  totalLosses: { type: 'number' },
                  totalDraws: { type: 'number' },
                  overallWinRate: { type: 'number', format: 'decimal' },
                  sportsPlayed: { type: 'number' },
                },
              },
            },
            totalCount: { type: 'number' },
            pagination: {
              type: 'object',
              properties: {
                limit: { type: 'number' },
                offset: { type: 'number' },
                hasMore: { type: 'boolean' },
              },
            },
          },
        },
        message: { type: 'string' },
      },
    },
  })
  async getOverallRanking(@Query('limit') limit?: number, @Query('offset') offset?: number) {
    try {
      // 기본값 설정
      const limitValue = Math.min(limit || 50, 100); // 최대 100개
      const offsetValue = offset || 0;

      // 전체 사용자 ELO 데이터 조회 (사용자별로 그룹화)
      const query = `
                SELECT 
                    u.id as userId,
                    u.nickname,
                    AVG(ue.elo_point) as averageElo,
                    SUM(ue.total_matches) as totalMatches,
                    SUM(ue.wins) as totalWins,
                    SUM(ue.losses) as totalLosses,
                    SUM(ue.draws) as totalDraws,
                    COUNT(DISTINCT ue.sport_category_id) as sportsPlayed
                FROM user_elo ue
                JOIN user u ON ue.user_id = u.id
                GROUP BY u.id, u.nickname
                HAVING SUM(ue.total_matches) > 0
                ORDER BY averageElo DESC, totalMatches DESC
                LIMIT ? OFFSET ?
            `;

      const countQuery = `
                SELECT COUNT(DISTINCT u.id) as totalCount
                FROM user_elo ue
                JOIN user u ON ue.user_id = u.id
                WHERE ue.total_matches > 0
            `;

      const [rankingData, countResult] = await Promise.all([
        this.userEloRepository.query(query, [limitValue, offsetValue]),
        this.userEloRepository.query(countQuery),
      ]);

      const totalCount = countResult[0]?.totalCount || 0;

      // 랭킹 데이터 구성
      const ranking = rankingData.map((row: any, index: number) => {
        const overallWinRate = row.totalMatches > 0 ? (row.totalWins / row.totalMatches) * 100 : 0;

        return {
          rank: offsetValue + index + 1,
          userId: row.userId,
          nickname: row.nickname,
          averageElo: Math.round(row.averageElo * 100) / 100, // 소수점 2자리
          totalMatches: row.totalMatches,
          totalWins: row.totalWins,
          totalLosses: row.totalLosses,
          totalDraws: row.totalDraws,
          overallWinRate: Math.round(overallWinRate * 100) / 100, // 소수점 2자리
          sportsPlayed: row.sportsPlayed,
        };
      });

      return {
        success: true,
        data: {
          ranking,
          totalCount,
          pagination: {
            limit: limitValue,
            offset: offsetValue,
            hasMore: offsetValue + limitValue < totalCount,
          },
        },
        message: `Found ${ranking.length} players in overall ranking`,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Error getting overall ranking: ${error.message}`,
      };
    }
  }
}
