import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenTransaction, TransactionStatus, TransactionType } from '../entities/token-transaction.entity';
import { User } from '../entities/user.entity';

export interface CreateTransactionDto {
    userId: number;
    transactionType: TransactionType;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    transactionHash?: string;
    blockchainAddress?: string;
    description?: string;
    metadata?: Record<string, any>;
    referenceId?: string;
    referenceType?: string;
}

@Injectable()
export class TokenTransactionService {
    constructor(
        @InjectRepository(TokenTransaction)
        private tokenTransactionRepository: Repository<TokenTransaction>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    /**
     * 새로운 토큰 거래 내역 생성
     */
    async createTransaction(createDto: CreateTransactionDto): Promise<TokenTransaction> {
        const transaction = this.tokenTransactionRepository.create({
            ...createDto,
            status: TransactionStatus.COMPLETED,
            processedAt: new Date(),
        });

        return await this.tokenTransactionRepository.save(transaction);
    }

    /**
     * 사용자의 토큰 거래 내역 조회 (페이지네이션)
     */
    async getUserTransactions(
        userId: number,
        page: number = 1,
        limit: number = 20,
    ): Promise<{
        transactions: TokenTransaction[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const [transactions, total] = await this.tokenTransactionRepository.findAndCount({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['user'],
        });

        const totalPages = Math.ceil(total / limit);

        return {
            transactions,
            total,
            page,
            limit,
            totalPages,
        };
    }

    /**
     * 특정 타입의 토큰 거래 내역 조회
     */
    async getTransactionsByType(
        userId: number,
        transactionType: TransactionType,
        page: number = 1,
        limit: number = 20,
    ): Promise<{
        transactions: TokenTransaction[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const [transactions, total] = await this.tokenTransactionRepository.findAndCount({
            where: {
                user: { id: userId },
                transactionType,
            },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['user'],
        });

        const totalPages = Math.ceil(total / limit);

        return {
            transactions,
            total,
            page,
            limit,
            totalPages,
        };
    }

    /**
     * 사용자의 토큰 잔액 변화 요약 조회
     */
    async getUserTokenSummary(userId: number): Promise<{
        totalEarned: number;
        totalSpent: number;
        currentBalance: number;
        transactionCount: number;
    }> {
        const result = await this.tokenTransactionRepository
            .createQueryBuilder('tx')
            .select([
                'SUM(CASE WHEN tx.amount > 0 THEN tx.amount ELSE 0 END) as totalEarned',
                'SUM(CASE WHEN tx.amount < 0 THEN ABS(tx.amount) ELSE 0 END) as totalSpent',
                'COUNT(*) as transactionCount'
            ])
            .where('tx.user.id = :userId', { userId })
            .andWhere('tx.status = :status', { status: TransactionStatus.COMPLETED })
            .getRawOne();

        const user = await this.userRepository.findOne({ where: { id: userId } });
        const currentBalance = user?.availableToken || 0;

        return {
            totalEarned: parseFloat(result?.totalEarned || '0'),
            totalSpent: parseFloat(result?.totalSpent || '0'),
            currentBalance,
            transactionCount: parseInt(result?.transactionCount || '0'),
        };
    }

    /**
     * 좋아요 관련 토큰 거래 내역 조회
     */
    async getLikeTransactions(
        userId: number,
        page: number = 1,
        limit: number = 20,
    ): Promise<{
        transactions: TokenTransaction[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const [transactions, total] = await this.tokenTransactionRepository.findAndCount({
            where: {
                user: { id: userId },
                transactionType: TransactionType.LIKE_DEDUCT,
            },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['user'],
        });

        const totalPages = Math.ceil(total / limit);

        return {
            transactions,
            total,
            page,
            limit,
            totalPages,
        };
    }

    /**
     * 트랜잭션 해시로 거래 내역 조회
     */
    async getTransactionByHash(transactionHash: string): Promise<TokenTransaction | null> {
        return await this.tokenTransactionRepository.findOne({
            where: { transactionHash },
            relations: ['user'],
        });
    }

    /**
     * 거래 내역 상태 업데이트
     */
    async updateTransactionStatus(
        transactionId: number,
        status: TransactionStatus,
        metadata?: Record<string, any>,
    ): Promise<TokenTransaction> {
        const transaction = await this.tokenTransactionRepository.findOne({
            where: { id: transactionId },
        });

        if (!transaction) {
            throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
        }

        transaction.status = status;
        if (metadata) {
            transaction.metadata = { ...transaction.metadata, ...metadata };
        }

        if (status === TransactionStatus.COMPLETED) {
            transaction.processedAt = new Date();
        }

        return await this.tokenTransactionRepository.save(transaction);
    }

    /**
     * 특정 기간 동안의 토큰 거래 내역 조회
     */
    async getTransactionsByDateRange(
        userId: number,
        startDate: Date,
        endDate: Date,
        page: number = 1,
        limit: number = 20,
    ): Promise<{
        transactions: TokenTransaction[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const [transactions, total] = await this.tokenTransactionRepository.findAndCount({
            where: {
                user: { id: userId },
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                } as any,
            },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['user'],
        });

        const totalPages = Math.ceil(total / limit);

        return {
            transactions,
            total,
            page,
            limit,
            totalPages,
        };
    }
}
