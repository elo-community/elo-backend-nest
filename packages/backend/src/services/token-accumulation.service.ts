import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenAccumulation, AccumulationType, AccumulationStatus } from '../entities/token-accumulation.entity';

export interface CreateAccumulationDto {
    walletAddress: string;
    reason: string;
    amount: number; // ETH 단위
    type: AccumulationType;
    metadata?: Record<string, any>;
}

export interface ClaimRequestDto {
    walletAddress: string;
    amount: number; // ETH 단위
    reason?: string;
}

@Injectable()
export class TokenAccumulationService {
    private readonly logger = new Logger(TokenAccumulationService.name);

    constructor(
        @InjectRepository(TokenAccumulation)
        private readonly tokenAccumulationRepository: Repository<TokenAccumulation>,
    ) {}

    /**
     * 사용자별 다음 nonce 조회
     */
    async getNextNonce(walletAddress: string): Promise<bigint> {
        const lastAccumulation = await this.tokenAccumulationRepository.findOne({
            where: { walletAddress },
            order: { nonce: 'DESC' }
        });

        return lastAccumulation ? lastAccumulation.nonce + 1n : 0n;
    }

    /**
     * 토큰 적립 생성
     */
    async createAccumulation(dto: CreateAccumulationDto): Promise<TokenAccumulation> {
        const nonce = await this.getNextNonce(dto.walletAddress);
        
        const accumulation = this.tokenAccumulationRepository.create({
            ...dto,
            amount: BigInt(dto.amount),
            nonce,
            status: AccumulationStatus.PENDING,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후 만료
        });

        const saved = await this.tokenAccumulationRepository.save(accumulation);
        this.logger.log(`Token accumulation created: ${dto.walletAddress}, amount: ${dto.amount}, nonce: ${nonce}`);
        
        return saved;
    }

    /**
     * 인기글 리워드 적립
     */
    async accumulateHotPostReward(walletAddress: string, postId: number, amount: number): Promise<TokenAccumulation> {
        // 중복 적립 방지
        const existing = await this.tokenAccumulationRepository.findOne({
            where: {
                walletAddress,
                type: AccumulationType.HOT_POST_REWARD,
                metadata: { postId },
                status: AccumulationStatus.PENDING
            }
        });

        if (existing) {
            throw new Error(`Hot post reward already accumulated for post ${postId}`);
        }

        return this.createAccumulation({
            walletAddress,
            reason: `Hot post reward for post ${postId}`,
            amount,
            type: AccumulationType.HOT_POST_REWARD,
            metadata: { postId }
        });
    }

    /**
     * 좋아요 리워드 적립
     */
    async accumulateLikeReward(walletAddress: string, postId: number, amount: number): Promise<TokenAccumulation> {
        // 중복 적립 방지
        const existing = await this.tokenAccumulationRepository.findOne({
            where: {
                walletAddress,
                type: AccumulationType.LIKE_REWARD,
                metadata: { postId },
                status: AccumulationStatus.PENDING
            }
        });

        if (existing) {
            throw new Error(`Like reward already accumulated for post ${postId}`);
        }

        return this.createAccumulation({
            walletAddress,
            reason: `Like reward for post ${postId}`,
            amount,
            type: AccumulationType.LIKE_REWARD,
            metadata: { postId }
        });
    }

    /**
     * 클레임 가능한 토큰 조회
     */
    async getClaimableTokens(walletAddress: string): Promise<TokenAccumulation[]> {
        return this.tokenAccumulationRepository.find({
            where: {
                walletAddress,
                status: AccumulationStatus.PENDING,
                expiresAt: { $gt: new Date() } as any
            },
            order: { nonce: 'ASC' }
        });
    }

    /**
     * 클레임 요청을 위한 데이터 준비
     */
    async prepareClaimRequest(dto: ClaimRequestDto): Promise<{
        to: string;
        amount: bigint;
        nonce: bigint;
        deadline: number;
        accumulations: TokenAccumulation[];
    }> {
        const claimableTokens = await this.getClaimableTokens(dto.walletAddress);
        
        if (claimableTokens.length === 0) {
            throw new Error('No claimable tokens found');
        }

        // 요청된 양만큼의 토큰이 있는지 확인
        const totalAmount = claimableTokens.reduce((sum, acc) => sum + acc.amount, 0n);
        const requestedAmount = BigInt(dto.amount);

        if (totalAmount < requestedAmount) {
            throw new Error(`Insufficient tokens. Available: ${totalAmount}, Requested: ${requestedAmount}`);
        }

        // 가장 낮은 nonce부터 사용
        const targetAccumulations = claimableTokens
            .sort((a, b) => Number(a.nonce - b.nonce))
            .slice(0, Math.ceil(Number(requestedAmount)));

        const deadline = Math.floor(Date.now() / 1000) + 3600; // 1시간 후 만료

        return {
            to: dto.walletAddress,
            amount: requestedAmount,
            nonce: targetAccumulations[0].nonce, // 가장 낮은 nonce 사용
            deadline,
            accumulations: targetAccumulations
        };
    }

    /**
     * 클레임 완료 처리
     */
    async markAsClaimed(
        walletAddress: string, 
        nonce: bigint, 
        txHash: string
    ): Promise<void> {
        const accumulation = await this.tokenAccumulationRepository.findOne({
            where: { walletAddress, nonce, status: AccumulationStatus.PENDING }
        });

        if (!accumulation) {
            throw new Error(`Accumulation not found for nonce ${nonce}`);
        }

        accumulation.status = AccumulationStatus.CLAIMED;
        accumulation.claimTxHash = txHash;
        accumulation.claimedAt = new Date();

        await this.tokenAccumulationRepository.save(accumulation);
        this.logger.log(`Token accumulation marked as claimed: ${walletAddress}, nonce: ${nonce}, tx: ${txHash}`);
    }

    /**
     * 사용자별 적립 히스토리 조회
     */
    async getAccumulationHistory(walletAddress: string): Promise<TokenAccumulation[]> {
        return this.tokenAccumulationRepository.find({
            where: { walletAddress },
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * 사용자별 총 적립량 조회
     */
    async getTotalAccumulatedAmount(walletAddress: string): Promise<bigint> {
        const result = await this.tokenAccumulationRepository
            .createQueryBuilder('acc')
            .select('SUM(acc.amount)', 'total')
            .where('acc.walletAddress = :walletAddress', { walletAddress })
            .andWhere('acc.status = :status', { status: AccumulationStatus.PENDING })
            .getRawOne();

        return BigInt(result?.total || 0);
    }
}
