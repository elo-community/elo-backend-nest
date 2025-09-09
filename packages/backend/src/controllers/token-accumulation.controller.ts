import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { CurrentUser } from '../auth/user.decorator';
import { AccumulationStatus } from '../entities/token-accumulation.entity';
import { TokenAccumulationService } from '../services/token-accumulation.service';

@ApiTags('token-accumulations')
@Controller('token-accumulations')
@UseGuards(JwtAuthGuard)
export class TokenAccumulationController {
  constructor(private readonly tokenAccumulationService: TokenAccumulationService) {}

  @Get()
  async getUserAccumulations(
    @CurrentUser() user: JwtUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: AccumulationStatus,
  ) {
    if (!user.walletAddress) {
      throw new Error('User wallet address not found');
    }

    const result = await this.tokenAccumulationService.getUserAccumulations(
      user.walletAddress,
      page,
      limit,
      status,
    );

    return {
      message: 'User token accumulations retrieved successfully',
      data: result,
    };
  }

  @Get('summary')
  @ApiOperation({
    summary: '사용자별 토큰 적립 요약 조회',
    description: '사용자의 토큰 적립 현황을 요약하여 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '토큰 적립 요약 조회 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: { $ref: '#/components/schemas/TokenAccumulationSummaryDto' },
      },
    },
  })
  async getUserAccumulationSummary(@CurrentUser() user: JwtUser) {
    if (!user.walletAddress) {
      throw new Error('User wallet address not found');
    }

    const summary = await this.tokenAccumulationService.getUserAccumulationSummary(
      user.walletAddress,
    );

    return {
      message: 'User token accumulation summary retrieved successfully',
      data: summary,
    };
  }

  @Get('pending')
  @ApiOperation({
    summary: '사용자별 대기 중인 토큰 적립 조회',
    description: '사용자의 대기 중인(PENDING) 토큰 적립만 조회합니다.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본값: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수 (기본값: 20)',
  })
  async getPendingAccumulations(
    @CurrentUser() user: JwtUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (!user.walletAddress) {
      throw new Error('User wallet address not found');
    }

    const result = await this.tokenAccumulationService.getUserAccumulations(
      user.walletAddress,
      page,
      limit,
      AccumulationStatus.PENDING,
    );

    return {
      message: 'User pending token accumulations retrieved successfully',
      data: result,
    };
  }

  @Get('claimed')
  @ApiOperation({
    summary: '사용자별 수령 완료된 토큰 적립 조회',
    description: '사용자의 수령 완료된(CLAIMED) 토큰 적립만 조회합니다.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본값: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수 (기본값: 20)',
  })
  async getClaimedAccumulations(
    @CurrentUser() user: JwtUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (!user.walletAddress) {
      throw new Error('User wallet address not found');
    }

    const result = await this.tokenAccumulationService.getUserAccumulations(
      user.walletAddress,
      page,
      limit,
      AccumulationStatus.CLAIMED,
    );

    return {
      message: 'User claimed token accumulations retrieved successfully',
      data: result,
    };
  }
}
