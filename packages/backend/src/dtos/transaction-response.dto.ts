import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus, TransactionType } from '../entities/token-transaction.entity';

/**
 * 표준화된 트랜잭션 메타데이터 인터페이스
 */
export interface StandardTransactionMetadata {
  // 공통 필드
  action:
    | 'like_deduct'
    | 'like_refund'
    | 'like_reward_claim'
    | 'available_token_claim'
    | 'reward_claim'
    | 'transfer_in'
    | 'transfer_out'
    | 'system_adjustment'
    | 'initial_sync'
    | 'unknown';
  source: string; // 트랜잭션 소스 (예: 'blockchain', 'system', 'user')

  // 컨텍스트 정보
  context?: string; // 컨텍스트 (예: 'post_like', 'reward_claim', 'initial_sync')
  reference_id?: string; // 관련 엔티티 ID
  reference_type?: string; // 관련 엔티티 타입

  // 블록체인 관련
  blockchain_event?: string; // 블록체인 이벤트명 (예: 'TokensClaimed', 'ClaimExecuted')
  nonce?: string; // nonce 값

  // 상태 정보
  balance_before?: number; // 이전 잔액
  balance_after?: number; // 이후 잔액
  available_token_before?: number; // 이전 available token
  available_token_after?: number; // 이후 available token

  // 추가 정보
  post_id?: number; // 게시글 ID (좋아요 관련)
  claim_type?: string; // 클레임 타입
  deadline?: string; // 만료 시간
  reason?: string; // 이유
  [key: string]: any; // 기타 추가 필드
}

/**
 * 트랜잭션 응답 DTO
 */
export class TransactionResponseDto {
  @ApiProperty({ description: '트랜잭션 ID' })
  id: number;

  @ApiProperty({ description: '사용자 정보' })
  user: {
    id: number;
    nickname?: string;
    walletAddress?: string;
  };

  @ApiProperty({ description: '트랜잭션 타입', enum: TransactionType })
  transactionType: TransactionType;

  @ApiProperty({ description: '트랜잭션 상태', enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty({ description: '블록체인 트랜잭션 해시' })
  transactionHash?: string;

  @ApiProperty({ description: '트랜잭션 설명' })
  description?: string;

  @ApiProperty({ description: '표준화된 메타데이터' })
  metadata: StandardTransactionMetadata;

  @ApiProperty({ description: '처리 완료 시간' })
  processedAt?: Date;

  // TransactionType에 따른 읽기 쉬운 정보
  @ApiProperty({ description: '트랜잭션 요약' })
  summary: {
    action: string; // "누가"
    target: string; // "어디로부터/어디로"
    reason: string; // "어떤 이유로"
    amount: string; // "몇 토큰을"
    direction: 'earned' | 'spent' | 'neutral'; // "획득/지불/중립"
    timestamp: string; // "언제"
  };
}

/**
 * 트랜잭션 타입별 요약 정보 생성
 */
export function createTransactionSummary(
  transactionType: TransactionType,
  amount: number,
  metadata: StandardTransactionMetadata,
  createdAt: Date,
): TransactionResponseDto['summary'] {
  const direction = amount > 0 ? 'earned' : amount < 0 ? 'spent' : 'neutral';
  const amountStr = `${Math.abs(amount)} EXP`;
  const timestamp = createdAt.toLocaleString('ko-KR');

  switch (transactionType) {
    case TransactionType.LIKE_DEDUCT:
      return {
        action: '좋아요',
        target: `게시글 #${metadata.post_id || 'N/A'}`,
        reason: '좋아요 시 토큰 차감',
        amount: amountStr,
        direction,
        timestamp,
      };

    case TransactionType.LIKE_REFUND:
      return {
        action: '좋아요 취소',
        target: `게시글 #${metadata.post_id || 'N/A'}`,
        reason: '좋아요 취소 시 토큰 반환',
        amount: amountStr,
        direction,
        timestamp,
      };

    case TransactionType.LIKE_REWARD_CLAIM:
      return {
        action: '좋아요 보상 수령',
        target: '블록체인',
        reason: '좋아요 누적 보상 수령',
        amount: amountStr,
        direction,
        timestamp,
      };

    case TransactionType.AVAILABLE_TOKEN_CLAIM:
      return {
        action: '누적 토큰 수령',
        target: '블록체인',
        reason: '누적 토큰 수령',
        amount: amountStr,
        direction,
        timestamp,
      };

    case TransactionType.REWARD_CLAIM:
      return {
        action: metadata.blockchain_event === 'TokensClaimed' ? '좋아요 보상' : '일반 보상',
        target: metadata.blockchain_event === 'TokensClaimed' ? '블록체인' : '시스템',
        reason: metadata.reason || '보상 지급',
        amount: amountStr,
        direction,
        timestamp,
      };

    case TransactionType.TRANSFER_IN:
      return {
        action: '토큰 입금',
        target: metadata.blockchainAddress || '외부',
        reason: metadata.reason || '토큰 입금',
        amount: amountStr,
        direction,
        timestamp,
      };

    case TransactionType.TRANSFER_OUT:
      return {
        action: '토큰 출금',
        target: metadata.blockchainAddress || '외부',
        reason: metadata.reason || '토큰 출금',
        amount: amountStr,
        direction,
        timestamp,
      };

    case TransactionType.SYSTEM_ADJUSTMENT:
      return {
        action: '시스템 조정',
        target: '시스템',
        reason: metadata.reason || '시스템 조정',
        amount: amountStr,
        direction,
        timestamp,
      };

    case TransactionType.INITIAL_SYNC:
      return {
        action: '초기 동기화',
        target: '블록체인',
        reason: '서버 시작 시 토큰 잔액 동기화',
        amount: amountStr,
        direction,
        timestamp,
      };

    default:
      return {
        action: '기타',
        target: '시스템',
        reason: metadata.reason || '기타 트랜잭션',
        amount: amountStr,
        direction,
        timestamp,
      };
  }
}

/**
 * 트랜잭션 엔티티를 응답 DTO로 변환
 */
export function mapTransactionToResponseDto(transaction: any, user: any): TransactionResponseDto {
  // 표준화된 메타데이터 생성
  const standardMetadata: StandardTransactionMetadata = {
    action: transaction.metadata?.action || 'unknown',
    source: transaction.metadata?.source || 'system',
    context: transaction.referenceType,
    reference_id: transaction.referenceId,
    reference_type: transaction.referenceType,
    blockchain_event: transaction.metadata?.blockchainEvent,
    nonce: transaction.metadata?.nonce,
    balance_before: transaction.balanceBefore,
    balance_after: transaction.balanceAfter,
    available_token_before: transaction.metadata?.availableTokenBefore,
    available_token_after: transaction.metadata?.availableTokenAfter,
    post_id: transaction.metadata?.postId,
    claim_type: transaction.metadata?.claim_type,
    deadline: transaction.metadata?.deadline,
    reason: transaction.metadata?.reason,
    ...transaction.metadata, // 기존 메타데이터도 유지
  };

  return {
    id: transaction.id,
    user: {
      id: user.id,
      nickname: user.nickname,
      walletAddress: user.walletAddress,
    },
    transactionType: transaction.transactionType,
    status: transaction.status,
    transactionHash: transaction.transactionHash,
    description: transaction.description,
    metadata: standardMetadata,
    processedAt: transaction.processedAt,
    summary: createTransactionSummary(
      transaction.transactionType,
      transaction.amount,
      standardMetadata,
      transaction.createdAt,
    ),
  };
}
