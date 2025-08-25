import { Controller, DefaultValuePipe, Get, HttpException, HttpStatus, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/user.decorator';
import { TrivusExpService } from '../blockchain/trivus-exp.service';
import { TransactionType } from '../entities/token-transaction.entity';
import { TokenTransactionService } from '../services/token-transaction.service';
import { UserService } from '../services/user.service';
import { ERROR_CODES, ERROR_MESSAGES } from '../shared/error-codes';

// TrivusEXP1363 컨트랙트 ABI는 TrivusExpService에서 가져옴

@Controller('token-transactions')
@UseGuards(JwtAuthGuard)
export class TokenTransactionsController {
    constructor(
        private readonly tokenTransactionService: TokenTransactionService,
        private readonly trivusExpService: TrivusExpService,
        private readonly userService: UserService,
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

            // 1. 사용자의 현재 available_token 개수 확인
            const userTokenInfo = await this.userService.getUserTokenInfo(user.walletAddress);

            if (!userTokenInfo.availableTokens || userTokenInfo.availableTokens <= 0) {
                throw new HttpException({
                    success: false,
                    data: null,
                    error: {
                        code: ERROR_CODES.NO_ACCUMULATED_TOKENS,
                        message: ERROR_MESSAGES[ERROR_CODES.NO_ACCUMULATED_TOKENS],
                        details: {
                            currentAvailableTokens: userTokenInfo.availableTokens || 0,
                            action: 'claim_all_accumulated'
                        }
                    }
                }, HttpStatus.BAD_REQUEST);
            }

            // 2. 사용자의 모든 누적 토큰을 한번에 수확하는 서명 생성
            const result = await this.trivusExpService.createTokenClaimSignature({
                address: user.walletAddress,
                reason: 'bulk_claim_accumulated_tokens'
            });

            // 현재 활성 네트워크 가져오기
            const activeNetwork = this.configService.get<string>('blockchain.activeNetwork');

            const trivusExpAddress = this.configService.get<string>(`blockchain.contracts.trivusExp.${activeNetwork}`);

            // 서명만 반환하고 DB 기록은 ClaimExecuted 이벤트 감지 시 처리
            return {
                success: true,
                data: {
                    to: user.walletAddress,
                    amount: result.amount,
                    deadline: result.deadline,
                    nonce: result.nonce,
                    signature: result.signature,
                    contractAddress: trivusExpAddress,
                    contractABI: this.trivusExpService.getContractAbi(),
                    userTokenInfo: {
                        availableTokens: userTokenInfo.availableTokens,
                        totalTokens: userTokenInfo.totalTokens,
                        pendingTokens: userTokenInfo.pendingTokens
                    },
                    message: `Use this signature to execute the claim on the blockchain. You are claiming ${userTokenInfo.availableTokens} EXP. The transaction will be recorded automatically when the claim is executed.`,
                },
                message: 'Token claim signature generated successfully'
            };
        } catch (error) {
            // NO_ACCUMULATED_TOKENS 에러인 경우 적절한 HTTP 상태 코드로 응답
            if ((error as any).code === ERROR_CODES.NO_ACCUMULATED_TOKENS) {
                throw new HttpException({
                    success: false,
                    data: null,
                    error: {
                        code: ERROR_CODES.NO_ACCUMULATED_TOKENS,
                        message: ERROR_MESSAGES[ERROR_CODES.NO_ACCUMULATED_TOKENS],
                        details: {
                            action: 'claim_all_accumulated'
                        }
                    }
                }, HttpStatus.BAD_REQUEST);
            }

            // 기타 에러는 500 Internal Server Error로 응답
            throw new HttpException({
                success: false,
                data: null,
                error: {
                    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
                    message: (error as Error).message,
                    details: {
                        action: 'claim_all_accumulated'
                    }
                }
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
