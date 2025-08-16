import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { CurrentUser } from '../auth/user.decorator';
import { TransactionType } from '../entities/token-transaction.entity';
import { TokenTransactionService } from '../services/token-transaction.service';

@Controller('token-transactions')
@UseGuards(JwtAuthGuard)
export class TokenTransactionsController {
    constructor(private readonly tokenTransactionService: TokenTransactionService) { }

    /**
     * 사용자의 전체 토큰 거래 내역 조회
     */
    @Get()
    async getUserTransactions(
        @CurrentUser() user: JwtUser,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        const result = await this.tokenTransactionService.getUserTransactions(user.id, page, limit);

        return {
            message: 'User token transactions retrieved successfully',
            data: result,
        };
    }

    /**
     * 사용자의 토큰 잔액 요약 조회
     */
    @Get('summary')
    async getUserTokenSummary(@CurrentUser() user: JwtUser) {
        const summary = await this.tokenTransactionService.getUserTokenSummary(user.id);

        return {
            message: 'User token summary retrieved successfully',
            data: summary,
        };
    }

    /**
     * 좋아요 관련 토큰 거래 내역 조회
     */
    @Get('likes')
    async getLikeTransactions(
        @CurrentUser() user: JwtUser,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        const result = await this.tokenTransactionService.getLikeTransactions(user.id, page, limit);

        return {
            message: 'Like-related token transactions retrieved successfully',
            data: result,
        };
    }

    /**
     * 특정 타입의 토큰 거래 내역 조회
     */
    @Get('type/:transactionType')
    async getTransactionsByType(
        @CurrentUser() user: JwtUser,
        @Query('transactionType') transactionType: TransactionType,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        const result = await this.tokenTransactionService.getTransactionsByType(
            user.id,
            transactionType,
            page,
            limit,
        );

        return {
            message: `Token transactions of type ${transactionType} retrieved successfully`,
            data: result,
        };
    }

    /**
     * 특정 기간 동안의 토큰 거래 내역 조회
     */
    @Get('date-range')
    async getTransactionsByDateRange(
        @CurrentUser() user: JwtUser,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid date format. Use YYYY-MM-DD format.');
        }

        const result = await this.tokenTransactionService.getTransactionsByDateRange(
            user.id,
            start,
            end,
            page,
            limit,
        );

        return {
            message: 'Token transactions by date range retrieved successfully',
            data: result,
        };
    }
}
