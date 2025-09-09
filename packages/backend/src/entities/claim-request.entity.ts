import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ClaimStatus {
  PENDING = 'pending',
  EXECUTED = 'executed',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

@Entity('claim_request')
@Index(['walletAddress', 'nonce'], { unique: true })
export class ClaimRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 42 })
  walletAddress: string;

  @Column({ type: 'varchar', length: 66 }) // 0x + 32바이트 hex = 66자
  nonce: string;

  @Column({ type: 'varchar', length: 100 })
  amount: string; // "10" (EXP 단위)

  @Column({ type: 'bigint' })
  deadline: bigint; // Unix timestamp

  @Column({ type: 'text' })
  signature: string;

  @Column({ type: 'varchar', length: 20, default: ClaimStatus.PENDING })
  status: ClaimStatus;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 66, nullable: true })
  transactionHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
