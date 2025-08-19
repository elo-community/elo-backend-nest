import { Controller, DefaultValuePipe, Get, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/user.decorator';
import { TrivusExpService } from '../blockchain/trivus-exp.service';
import { TransactionType } from '../entities/token-transaction.entity';
import { TokenTransactionService } from '../services/token-transaction.service';

@Controller('token-transactions')
@UseGuards(JwtAuthGuard)
export class TokenTransactionsController {
    constructor(
        private readonly tokenTransactionService: TokenTransactionService,
        private readonly trivusExpService: TrivusExpService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * 테스트용: 인증 없이 토큰 거래 내역 조회
     */
    @Get('test/public')
    @Public()
    async getPublicTransactions() {
        try {
            const result = await this.tokenTransactionService.getAllTransactions();
            return {
                message: 'Public token transactions retrieved successfully',
                data: result,
            };
        } catch (error) {
            return {
                message: 'Failed to retrieve token transactions',
                error: (error as Error).message,
            };
        }
    }

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

    /**
     * 사용자의 모든 누적 토큰을 한번에 수확
     */
    @Post('claim-all-accumulated')
    async claimAllAccumulatedTokens(@CurrentUser() user: JwtUser) {
        try {
            if (!user.walletAddress) {
                throw new Error('User wallet address not found');
            }

            // 사용자의 모든 누적 토큰을 한번에 수확하는 서명 생성
            const result = await this.trivusExpService.createTokenClaimSignature({
                address: user.walletAddress,
            });

            // TrivusEXP1363 컨트랙트 주소 가져오기
            const trivusExpAddress = this.configService.get<string>('blockchain.contracts.trivusExp.amoy');

            // 서명만 반환하고 DB 기록은 ClaimExecuted 이벤트 감지 시 처리
            return {
                message: 'Token claim signature generated successfully',
                data: {
                    signature: result.signature,
                    nonce: result.nonce,
                    deadline: result.deadline,
                    amount: result.amount,
                    contractAddress: trivusExpAddress,
                    message: 'Use this signature to execute the claim on the blockchain. The transaction will be recorded automatically when the claim is executed.',
                },
            };
        } catch (error) {
            return {
                message: 'Failed to generate token claim signature',
                error: (error as Error).message,
            };
        }
    }
}
