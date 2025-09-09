import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TokenAccumulationResponseDto,
  TokenAccumulationSummaryDto,
  createAccumulationSummaryResponse,
  mapAccumulationToResponseDto,
} from '../dtos/token-accumulation-response.dto';
import {
  AccumulationStatus,
  AccumulationType,
  TokenAccumulation,
} from '../entities/token-accumulation.entity';
import { ClaimNonceService } from './claim-nonce.service';

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
    private readonly claimNonceService: ClaimNonceService,
  ) {}

  /**
   * 사용자별 다음 nonce 조회
   */
  async getNextNonce(walletAddress: string): Promise<string> {
    // claim-nonce.service.ts와 동일한 nonce 생성 방식 사용
    return await this.claimNonceService.getNextNonce(walletAddress);
  }

  /**
   * 토큰 적립 생성
   */
  async createAccumulation(dto: CreateAccumulationDto): Promise<TokenAccumulation> {
    const nonce = await this.getNextNonce(dto.walletAddress);

    const accumulation = this.tokenAccumulationRepository.create({
      ...dto,
      amount: BigInt(dto.amount),
      nonce: nonce, // string으로 저장
      status: AccumulationStatus.PENDING,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후 만료
    });

    const saved = await this.tokenAccumulationRepository.save(accumulation);
    this.logger.log(
      `Token accumulation created: ${dto.walletAddress}, amount: ${dto.amount}, nonce: ${nonce}`,
    );

    return saved;
  }

  /**
   * 인기글 리워드 적립
   */
  async accumulateHotPostReward(
    walletAddress: string,
    postId: number,
    amount: number,
  ): Promise<TokenAccumulation> {
    // 중복 적립 방지
    const existing = await this.tokenAccumulationRepository.findOne({
      where: {
        walletAddress,
        type: AccumulationType.HOT_POST_REWARD,
        metadata: { postId },
        status: AccumulationStatus.PENDING,
      },
    });

    if (existing) {
      throw new Error(`Hot post reward already accumulated for post ${postId}`);
    }

    return this.createAccumulation({
      walletAddress,
      reason: `Hot post reward for post ${postId}`,
      amount,
      type: AccumulationType.HOT_POST_REWARD,
      metadata: { postId },
    });
  }

  /**
   * 좋아요 리워드 적립
   */
  async accumulateLikeReward(
    walletAddress: string,
    postId: number,
    amount: number,
  ): Promise<TokenAccumulation> {
    // 중복 적립 방지
    const existing = await this.tokenAccumulationRepository.findOne({
      where: {
        walletAddress,
        type: AccumulationType.LIKE_REWARD,
        metadata: { postId },
        status: AccumulationStatus.PENDING,
      },
    });

    if (existing) {
      throw new Error(`Like reward already accumulated for post ${postId}`);
    }

    return this.createAccumulation({
      walletAddress,
      reason: `Like reward for post ${postId}`,
      amount,
      type: AccumulationType.LIKE_REWARD,
      metadata: { postId },
    });
  }

  /**
   * 튜토리얼 첫글 작성 보상 적립
   */
  async accumulateTutorialFirstPostReward(walletAddress: string): Promise<TokenAccumulation> {
    // 중복 적립 방지
    const existing = await this.tokenAccumulationRepository.findOne({
      where: {
        walletAddress,
        type: AccumulationType.TUTORIAL_FIRST_POST,
        status: AccumulationStatus.PENDING,
      },
    });

    if (existing) {
      throw new Error(`Tutorial first post reward already accumulated for ${walletAddress}`);
    }

    return this.createAccumulation({
      walletAddress,
      reason: 'Tutorial: First post reward',
      amount: 3, // 3 토큰
      type: AccumulationType.TUTORIAL_FIRST_POST,
      metadata: { tutorial_type: 'first_post' },
    });
  }

  /**
   * 튜토리얼 첫 매치결과 등록 보상 적립
   */
  async accumulateTutorialFirstMatchReward(walletAddress: string): Promise<TokenAccumulation> {
    // 중복 적립 방지
    const existing = await this.tokenAccumulationRepository.findOne({
      where: {
        walletAddress,
        type: AccumulationType.TUTORIAL_FIRST_MATCH,
        status: AccumulationStatus.PENDING,
      },
    });

    if (existing) {
      throw new Error(`Tutorial first match reward already accumulated for ${walletAddress}`);
    }

    return this.createAccumulation({
      walletAddress,
      reason: 'Tutorial: First match result reward',
      amount: 5, // 5 토큰
      type: AccumulationType.TUTORIAL_FIRST_MATCH,
      metadata: { tutorial_type: 'first_match' },
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
        expiresAt: { $gt: new Date() } as any,
      },
      order: { nonce: 'ASC' },
    });
  }

  /**
   * 클레임 요청을 위한 데이터 준비
   */
  async prepareClaimRequest(dto: ClaimRequestDto): Promise<{
    to: string;
    amount: bigint;
    nonce: string;
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
      throw new Error(
        `Insufficient tokens. Available: ${totalAmount}, Requested: ${requestedAmount}`,
      );
    }

    // 가장 낮은 nonce부터 사용 (string 비교)
    const targetAccumulations = claimableTokens
      .sort((a, b) => a.nonce.localeCompare(b.nonce))
      .slice(0, Math.ceil(Number(requestedAmount)));

    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1시간 후 만료

    return {
      to: dto.walletAddress,
      amount: requestedAmount,
      nonce: targetAccumulations[0].nonce, // 가장 낮은 nonce 사용
      deadline,
      accumulations: targetAccumulations,
    };
  }

  /**
   * 클레임 완료 처리
   */
  async markAsClaimed(walletAddress: string, nonce: string, txHash: string): Promise<void> {
    const accumulation = await this.tokenAccumulationRepository.findOne({
      where: { walletAddress, nonce, status: AccumulationStatus.PENDING },
    });

    if (!accumulation) {
      throw new Error(`Accumulation not found for nonce ${nonce}`);
    }

    accumulation.status = AccumulationStatus.CLAIMED;
    accumulation.claimTxHash = txHash;
    accumulation.claimedAt = new Date();

    await this.tokenAccumulationRepository.save(accumulation);
    this.logger.log(
      `Token accumulation marked as claimed: ${walletAddress}, nonce: ${nonce}, tx: ${txHash}`,
    );
  }

  /**
   * 사용자별 적립 히스토리 조회
   */
  async getAccumulationHistory(walletAddress: string): Promise<TokenAccumulation[]> {
    return this.tokenAccumulationRepository.find({
      where: { walletAddress },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 사용자별 총 적립량 조회
   */
  async getTotalAccumulatedAmount(walletAddress: string): Promise<string> {
    const result = await this.tokenAccumulationRepository
      .createQueryBuilder('acc')
      .select('SUM(acc.amount)', 'total')
      .where('acc.walletAddress = :walletAddress', { walletAddress })
      .andWhere('acc.status = :status', { status: AccumulationStatus.PENDING })
      .getRawOne();

    return BigInt(result?.total || 0).toString();
  }

  /**
   * 사용자별 적립 내역 조회 (페이지네이션)
   */
  async getUserAccumulations(
    walletAddress: string,
    page: number = 1,
    limit: number = 20,
    status?: AccumulationStatus,
  ): Promise<{
    accumulations: TokenAccumulationResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: {
      totalPending: number;
      totalClaimed: number;
      totalExpired: number;
      totalAmount: number;
    };
  }> {
    // 기본 쿼리 빌더
    const queryBuilder = this.tokenAccumulationRepository
      .createQueryBuilder('acc')
      .where('acc.walletAddress = :walletAddress', { walletAddress });

    // 상태별 필터링
    if (status) {
      queryBuilder.andWhere('acc.status = :status', { status });
    }

    // 전체 개수 조회
    const total = await queryBuilder.getCount();

    // 페이지네이션 적용하여 데이터 조회
    const accumulations = await queryBuilder
      .orderBy('acc.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // 요약 정보 조회
    const summaryResult = await this.tokenAccumulationRepository
      .createQueryBuilder('acc')
      .select([
        'SUM(CASE WHEN acc.status = :pending THEN acc.amount ELSE 0 END) as totalPending',
        'SUM(CASE WHEN acc.status = :claimed THEN acc.amount ELSE 0 END) as totalClaimed',
        'SUM(CASE WHEN acc.status = :expired THEN acc.amount ELSE 0 END) as totalExpired',
        'SUM(acc.amount) as totalAmount',
      ])
      .where('acc.walletAddress = :walletAddress', { walletAddress })
      .setParameters({
        pending: AccumulationStatus.PENDING,
        claimed: AccumulationStatus.CLAIMED,
        expired: AccumulationStatus.EXPIRED,
        walletAddress,
      })
      .getRawOne();

    const summary = {
      totalPending: Number(BigInt(summaryResult?.totalPending || 0)),
      totalClaimed: Number(BigInt(summaryResult?.totalClaimed || 0)),
      totalExpired: Number(BigInt(summaryResult?.totalExpired || 0)),
      totalAmount: Number(BigInt(summaryResult?.totalAmount || 0)),
    };

    // DTO로 변환
    const accumulationDtos = accumulations.map(accumulation =>
      mapAccumulationToResponseDto(accumulation),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      accumulations: accumulationDtos,
      total,
      page,
      limit,
      totalPages,
      summary,
    };
  }

  /**
   * 사용자별 적립 내역 요약 조회
   */
  async getUserAccumulationSummary(walletAddress: string): Promise<TokenAccumulationSummaryDto> {
    const [summaryResult, countsResult] = await Promise.all([
      // 금액 요약
      this.tokenAccumulationRepository
        .createQueryBuilder('acc')
        .select([
          'SUM(CASE WHEN acc.status = :pending THEN acc.amount ELSE 0 END) as totalPending',
          'SUM(CASE WHEN acc.status = :claimed THEN acc.amount ELSE 0 END) as totalClaimed',
          'SUM(CASE WHEN acc.status = :expired THEN acc.amount ELSE 0 END) as totalExpired',
          'SUM(acc.amount) as totalAmount',
        ])
        .where('acc.walletAddress = :walletAddress', { walletAddress })
        .setParameters({
          pending: AccumulationStatus.PENDING,
          claimed: AccumulationStatus.CLAIMED,
          expired: AccumulationStatus.EXPIRED,
          walletAddress,
        })
        .getRawOne(),

      // 개수 요약
      this.tokenAccumulationRepository
        .createQueryBuilder('acc')
        .select([
          'COUNT(CASE WHEN acc.status = :pending THEN 1 END) as pendingCount',
          'COUNT(CASE WHEN acc.status = :claimed THEN 1 END) as claimedCount',
          'COUNT(CASE WHEN acc.status = :expired THEN 1 END) as expiredCount',
        ])
        .where('acc.walletAddress = :walletAddress', { walletAddress })
        .setParameters({
          pending: AccumulationStatus.PENDING,
          claimed: AccumulationStatus.CLAIMED,
          expired: AccumulationStatus.EXPIRED,
          walletAddress,
        })
        .getRawOne(),
    ]);

    const summary = {
      totalPending: Number(BigInt(summaryResult?.totalPending || 0)),
      totalClaimed: Number(BigInt(summaryResult?.totalClaimed || 0)),
      totalExpired: Number(BigInt(summaryResult?.totalExpired || 0)),
      totalAmount: Number(BigInt(summaryResult?.totalAmount || 0)),
      pendingCount: Number(countsResult?.pendingCount || 0),
      claimedCount: Number(countsResult?.claimedCount || 0),
      expiredCount: Number(countsResult?.expiredCount || 0),
    };

    return createAccumulationSummaryResponse(summary);
  }

  /**
   * 특정 게시글과 관련된 token_accumulation 상태를 CLAIMED로 업데이트
   * (좋아요 클레임 완료 시 사용)
   */
  async markLikeRewardAsClaimed(
    walletAddress: string,
    postId: number,
    txHash: string,
  ): Promise<void> {
    const accumulation = await this.tokenAccumulationRepository.findOne({
      where: {
        walletAddress,
        type: AccumulationType.LIKE_REWARD,
        metadata: { postId },
        status: AccumulationStatus.PENDING,
      },
    });

    if (!accumulation) {
      this.logger.warn(
        `Like reward accumulation not found for wallet ${walletAddress}, post ${postId}`,
      );
      return;
    }

    accumulation.status = AccumulationStatus.CLAIMED;
    accumulation.claimTxHash = txHash;
    accumulation.claimedAt = new Date();

    await this.tokenAccumulationRepository.save(accumulation);
    this.logger.log(
      `Like reward accumulation marked as claimed: ${walletAddress}, post ${postId}, tx: ${txHash}`,
    );
  }

  /**
   * 특정 nonce의 token_accumulation 상태를 CLAIMED로 업데이트
   * (벌크 클레임 완료 시 사용)
   */
  async markByNonceAsClaimed(walletAddress: string, nonce: string, txHash: string): Promise<void> {
    const accumulation = await this.tokenAccumulationRepository.findOne({
      where: { walletAddress, nonce, status: AccumulationStatus.PENDING },
    });

    if (!accumulation) {
      this.logger.warn(`Accumulation not found for wallet ${walletAddress}, nonce ${nonce}`);
      return;
    }

    accumulation.status = AccumulationStatus.CLAIMED;
    accumulation.claimTxHash = txHash;
    accumulation.claimedAt = new Date();

    await this.tokenAccumulationRepository.save(accumulation);
    this.logger.log(
      `Accumulation marked as claimed: ${walletAddress}, nonce ${nonce}, tx: ${txHash}`,
    );
  }

  /**
   * 사용자의 모든 pending 상태인 token_accumulation을 CLAIMED로 업데이트
   * (벌크 클레임 완료 시 사용)
   */
  async markAllPendingAsClaimed(walletAddress: string, txHash: string): Promise<number> {
    const result = await this.tokenAccumulationRepository.update(
      {
        walletAddress,
        status: AccumulationStatus.PENDING,
      },
      {
        status: AccumulationStatus.CLAIMED,
        claimTxHash: txHash,
        claimedAt: new Date(),
      },
    );

    const updatedCount = result.affected || 0;
    this.logger.log(
      `All pending accumulations marked as claimed: ${walletAddress}, count: ${updatedCount}, tx: ${txHash}`,
    );

    return updatedCount;
  }
}
