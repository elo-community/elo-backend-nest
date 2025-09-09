import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  mapTransactionToResponseDto,
  StandardTransactionMetadata,
  TransactionResponseDto,
} from '../dtos/transaction-response.dto';
import {
  TokenTransaction,
  TransactionStatus,
  TransactionType,
} from '../entities/token-transaction.entity';
import { User } from '../entities/user.entity';

export interface CreateTransactionDto {
  userId: number;
  transactionType: TransactionType;
  amount: number;
  balanceBefore?: number; // 선택적 필드로 변경
  balanceAfter?: number; // 선택적 필드로 변경
  transactionHash?: string;
  blockchainAddress?: string;
  description?: string;
  metadata?: Record<string, any>;
  referenceId?: string;
  referenceType?: string;
}

/**
 * 표준화된 메타데이터 생성 유틸리티
 */
export function createStandardMetadata(
  transactionType: TransactionType,
  customMetadata: Record<string, any> = {},
): StandardTransactionMetadata {
  const baseMetadata: StandardTransactionMetadata = {
    action: getActionFromType(transactionType),
    source: getSourceFromType(transactionType),
    ...customMetadata,
  };

  return baseMetadata;
}

/**
 * 트랜잭션 타입에 따른 액션 반환
 */
function getActionFromType(
  transactionType: TransactionType,
): StandardTransactionMetadata['action'] {
  switch (transactionType) {
    case TransactionType.LIKE_DEDUCT:
      return 'like_deduct';
    case TransactionType.LIKE_REFUND:
      return 'like_refund';
    case TransactionType.LIKE_REWARD_CLAIM:
      return 'like_reward_claim';
    case TransactionType.AVAILABLE_TOKEN_CLAIM:
      return 'available_token_claim';
    case TransactionType.REWARD_CLAIM:
      return 'reward_claim';
    case TransactionType.TRANSFER_IN:
      return 'transfer_in';
    case TransactionType.TRANSFER_OUT:
      return 'transfer_out';
    case TransactionType.SYSTEM_ADJUSTMENT:
      return 'system_adjustment';
    case TransactionType.INITIAL_SYNC:
      return 'initial_sync';
    default:
      return 'unknown';
  }
}

/**
 * 트랜잭션 타입에 따른 소스 반환
 */
function getSourceFromType(transactionType: TransactionType): string {
  switch (transactionType) {
    case TransactionType.LIKE_REWARD_CLAIM:
    case TransactionType.AVAILABLE_TOKEN_CLAIM:
    case TransactionType.TRANSFER_IN:
    case TransactionType.TRANSFER_OUT:
    case TransactionType.REWARD_CLAIM:
      return 'blockchain';
    case TransactionType.LIKE_DEDUCT:
    case TransactionType.LIKE_REFUND:
    case TransactionType.SYSTEM_ADJUSTMENT:
    case TransactionType.INITIAL_SYNC:
      return 'system';
    default:
      return 'system';
  }
}

@Injectable()
export class TokenTransactionService {
  constructor(
    @InjectRepository(TokenTransaction)
    private tokenTransactionRepository: Repository<TokenTransaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 새로운 토큰 거래 내역 생성 (표준화된 메타데이터 포함)
   */
  async createTransaction(createDto: CreateTransactionDto): Promise<TokenTransaction> {
    // userId로 사용자 조회
    const user = await this.userRepository.findOne({ where: { id: createDto.userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${createDto.userId} not found`);
    }

    // balanceBefore와 balanceAfter가 제공되지 않은 경우 자동 계산
    let balanceBefore = createDto.balanceBefore;
    let balanceAfter = createDto.balanceAfter;

    if (balanceBefore === undefined || balanceAfter === undefined) {
      balanceBefore = parseFloat(user.availableToken?.toString() || '0');
      balanceAfter = balanceBefore + createDto.amount;
    }

    // 표준화된 메타데이터 생성
    const standardMetadata = createStandardMetadata(createDto.transactionType, {
      ...createDto.metadata,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      available_token_before: user.availableToken || 0,
      available_token_after: user.availableToken || 0,
      reference_id: createDto.referenceId,
      reference_type: createDto.referenceType,
    });

    const transaction = this.tokenTransactionRepository.create({
      ...createDto,
      balanceBefore,
      balanceAfter,
      user: user, // user 관계 설정
      status: TransactionStatus.COMPLETED,
      processedAt: new Date(),
      metadata: standardMetadata,
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
    transactions: TransactionResponseDto[];
    user: User;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // 사용자 정보는 한 번만 조회
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // 트랜잭션은 user relations 없이 조회
    const [transactions, total] = await this.tokenTransactionRepository.findAndCount({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // DTO로 변환
    const transactionDtos = transactions.map(transaction =>
      mapTransactionToResponseDto(transaction, user),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      transactions: transactionDtos,
      user,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * 테스트용: 모든 토큰 거래 내역 조회
   */
  async getAllTransactions(): Promise<TokenTransaction[]> {
    return await this.tokenTransactionRepository.find({
      order: { createdAt: 'DESC' },
      take: 50, // 최근 50개만 조회
    });
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
    transactions: TransactionResponseDto[];
    user: User;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // 사용자 정보는 한 번만 조회
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const [transactions, total] = await this.tokenTransactionRepository.findAndCount({
      where: {
        user: { id: userId },
        transactionType,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // DTO로 변환
    const transactionDtos = transactions.map(transaction =>
      mapTransactionToResponseDto(transaction, user),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      transactions: transactionDtos,
      user,
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
        'COUNT(*) as transactionCount',
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
    transactions: TransactionResponseDto[];
    user: User;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // 사용자 정보는 한 번만 조회
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const [transactions, total] = await this.tokenTransactionRepository.findAndCount({
      where: {
        user: { id: userId },
        transactionType: TransactionType.LIKE_DEDUCT,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // DTO로 변환
    const transactionDtos = transactions.map(transaction =>
      mapTransactionToResponseDto(transaction, user),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      transactions: transactionDtos,
      user,
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
    });
  }

  /**
   * 트랜잭션 해시와 타입으로 거래 내역 조회 (중복 체크용)
   */
  async getTransactionByHashAndType(
    transactionHash: string,
    transactionType: TransactionType,
  ): Promise<TokenTransaction | null> {
    return await this.tokenTransactionRepository.findOne({
      where: {
        transactionHash,
        transactionType,
      },
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
    transactions: TransactionResponseDto[];
    user: User;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // 사용자 정보는 한 번만 조회
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

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
    });

    // DTO로 변환
    const transactionDtos = transactions.map(transaction =>
      mapTransactionToResponseDto(transaction, user),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      transactions: transactionDtos,
      user,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
