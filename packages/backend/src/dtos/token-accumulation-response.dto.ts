import { ApiProperty } from '@nestjs/swagger';
import { AccumulationStatus, AccumulationType } from '../entities/token-accumulation.entity';

/**
 * 토큰 적립 응답 DTO
 */
export class TokenAccumulationResponseDto {
  @ApiProperty({ description: '적립 ID' })
  id: number;

  @ApiProperty({ description: '지갑 주소' })
  walletAddress: string;

  @ApiProperty({ description: '적립 이유' })
  reason: string;

  @ApiProperty({ description: '적립량 (EXP 단위)' })
  amount: number;

  @ApiProperty({ description: '적립 타입', enum: AccumulationType })
  type: AccumulationType;

  @ApiProperty({ description: '고유 nonce 값' })
  nonce: string;

  @ApiProperty({ description: '적립 상태', enum: AccumulationStatus })
  status: AccumulationStatus;

  @ApiProperty({ description: '클레임 트랜잭션 해시', nullable: true })
  claimTxHash?: string;

  @ApiProperty({ description: '클레임 완료 시간', nullable: true })
  claimedAt?: Date;

  @ApiProperty({ description: '생성 시간' })
  createdAt: Date;

  @ApiProperty({ description: '수정 시간' })
  updatedAt: Date;

  @ApiProperty({ description: '메타데이터', nullable: true })
  metadata?: Record<string, any>;

  // 사용자 친화적인 정보
  @ApiProperty({ description: '적립 요약 정보' })
  summary: {
    action: string; // "무엇을"
    source: string; // "어디서"
    reason: string; // "왜"
    amount: string; // "얼마나"
    status: string; // "현재 상태"
    canClaim: boolean; // "수령 가능 여부"
  };
}

/**
 * 토큰 적립 요약 정보 생성
 */
export function createAccumulationSummary(
  accumulation: any,
): TokenAccumulationResponseDto['summary'] {
  const amountStr = `${Number(accumulation.amount)} EXP`;
  const statusText = getStatusText(accumulation.status);
  const canClaim = accumulation.status === AccumulationStatus.PENDING;

  return {
    action: getActionFromType(accumulation.type),
    source: getSourceFromType(accumulation.type),
    reason: accumulation.reason,
    amount: amountStr,
    status: statusText,
    canClaim,
  };
}

/**
 * 적립 타입에 따른 액션 반환
 */
function getActionFromType(type: AccumulationType): string {
  switch (type) {
    case AccumulationType.HOT_POST_REWARD:
      return '인기글 보상';
    case AccumulationType.TUTORIAL_FIRST_POST:
      return '튜토리얼 첫 게시글';
    case AccumulationType.TUTORIAL_FIRST_MATCH:
      return '튜토리얼 첫 매치';
    case AccumulationType.CUSTOM:
      return '사용자 정의';
    default:
      return '기타';
  }
}

/**
 * 적립 타입에 따른 소스 반환
 */
function getSourceFromType(type: AccumulationType): string {
  switch (type) {
    case AccumulationType.HOT_POST_REWARD:
      return '시스템';
    case AccumulationType.TUTORIAL_FIRST_POST:
    case AccumulationType.TUTORIAL_FIRST_MATCH:
      return '튜토리얼';
    case AccumulationType.CUSTOM:
      return '사용자';
    default:
      return '시스템';
  }
}

/**
 * 상태에 따른 텍스트 반환
 */
function getStatusText(status: AccumulationStatus): string {
  switch (status) {
    case AccumulationStatus.PENDING:
      return '대기 중';
    case AccumulationStatus.CLAIMED:
      return '수령 완료';
    case AccumulationStatus.EXPIRED:
      return '만료됨';
    default:
      return '알 수 없음';
  }
}

/**
 * 적립 엔티티를 응답 DTO로 변환
 */
export function mapAccumulationToResponseDto(accumulation: any): TokenAccumulationResponseDto {
  return {
    id: accumulation.id,
    walletAddress: accumulation.walletAddress,
    reason: accumulation.reason,
    amount: Number(accumulation.amount),
    type: accumulation.type,
    nonce: accumulation.nonce,
    status: accumulation.status,
    claimTxHash: accumulation.claimTxHash,
    claimedAt: accumulation.claimedAt,
    createdAt: accumulation.createdAt,
    updatedAt: accumulation.updatedAt,
    metadata: accumulation.metadata,
    summary: createAccumulationSummary(accumulation),
  };
}

/**
 * 적립 요약 응답 DTO
 */
export class TokenAccumulationSummaryDto {
  @ApiProperty({ description: '대기 중인 총 적립량' })
  totalPending: number;

  @ApiProperty({ description: '수령 완료된 총 적립량' })
  totalClaimed: number;

  @ApiProperty({ description: '만료된 총 적립량' })
  totalExpired: number;

  @ApiProperty({ description: '전체 적립량' })
  totalAmount: number;

  @ApiProperty({ description: '대기 중인 적립 건수' })
  pendingCount: number;

  @ApiProperty({ description: '수령 완료된 적립 건수' })
  claimedCount: number;

  @ApiProperty({ description: '만료된 적립 건수' })
  expiredCount: number;

  // 사용자 친화적인 요약
  @ApiProperty({ description: '사용자 친화적인 요약' })
  summary: {
    availableToClaim: string; // "수령 가능한 토큰"
    totalEarned: string; // "총 획득한 토큰"
    pendingItems: string; // "대기 중인 항목"
    status: string; // "전체 상태"
  };
}

/**
 * 적립 요약 정보 생성
 */
export function createAccumulationSummaryResponse(summary: any): TokenAccumulationSummaryDto {
  return {
    ...summary,
    summary: {
      availableToClaim: `${summary.totalPending} EXP`,
      totalEarned: `${summary.totalClaimed} EXP`,
      pendingItems: `${summary.pendingCount}개 항목`,
      status: summary.totalPending > 0 ? '수령 가능' : '수령 완료',
    },
  };
}
