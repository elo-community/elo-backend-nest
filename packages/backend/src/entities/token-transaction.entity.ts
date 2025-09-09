import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum TransactionType {
  LIKE_DEDUCT = 'LIKE_DEDUCT', // 좋아요 시 토큰 차감
  LIKE_REFUND = 'LIKE_REFUND', // 좋아요 취소 시 토큰 반환
  REWARD_CLAIM = 'REWARD_CLAIM', // 보상 지급 (기존 호환성)
  LIKE_REWARD_CLAIM = 'LIKE_REWARD_CLAIM', // 좋아요 클레임
  AVAILABLE_TOKEN_CLAIM = 'AVAILABLE_TOKEN_CLAIM', // available token 클레임
  TRANSFER_IN = 'TRANSFER_IN', // 외부에서 토큰 입금
  TRANSFER_OUT = 'TRANSFER_OUT', // 외부로 토큰 출금
  SYSTEM_ADJUSTMENT = 'SYSTEM_ADJUSTMENT', // 시스템 조정
  INITIAL_SYNC = 'INITIAL_SYNC', // 서버 시작 시 초기 토큰 잔액 동기화
}

export enum TransactionStatus {
  PENDING = 'PENDING', // 처리 중
  COMPLETED = 'COMPLETED', // 완료
  FAILED = 'FAILED', // 실패
  CANCELLED = 'CANCELLED', // 취소됨
}

@Entity('token_tx')
export class TokenTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'enum', enum: TransactionType, name: 'transaction_type', nullable: false })
  transactionType!: TransactionType;

  @Column({ type: 'decimal', precision: 20, scale: 8, name: 'amount', nullable: false })
  amount!: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, name: 'balance_before', nullable: false })
  balanceBefore!: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, name: 'balance_after', nullable: false })
  balanceAfter!: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    name: 'status',
    nullable: false,
    default: TransactionStatus.COMPLETED,
  })
  status!: TransactionStatus;

  @Column({ type: 'varchar', length: 255, name: 'transaction_hash', nullable: true })
  transactionHash?: string;

  @Column({ type: 'varchar', length: 255, name: 'blockchain_address', nullable: true })
  blockchainAddress?: string;

  @Column({ type: 'varchar', length: 500, name: 'description', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', name: 'metadata', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'varchar', length: 255, name: 'reference_id', nullable: true })
  referenceId?: string; // 관련 엔티티 ID (예: post_like.id)

  @Column({ type: 'varchar', length: 255, name: 'reference_type', nullable: true })
  referenceType?: string; // 관련 엔티티 타입 (예: 'post_like', 'reward_claim')

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', nullable: false })
  createdAt!: Date;

  @Column({ type: 'timestamp', name: 'processed_at', nullable: true })
  processedAt?: Date;
}
