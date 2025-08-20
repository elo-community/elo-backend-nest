import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum AccumulationType {
    HOT_POST_REWARD = 'hot_post_reward',
    LIKE_REWARD = 'like_reward',
    TUTORIAL_FIRST_POST = 'tutorial_first_post',
    TUTORIAL_FIRST_MATCH = 'tutorial_first_match',
    CUSTOM = 'custom'
}

export enum AccumulationStatus {
    PENDING = 'pending',
    CLAIMED = 'claimed',
    EXPIRED = 'expired'
}

@Entity('token_accumulations')
export class TokenAccumulation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 42 })
    @Index()
    walletAddress: string;

    @Column('varchar', { length: 100 })
    reason: string;

    @Column('bigint')
    amount: bigint; // ETH 단위 (10^18 제거된 값)

    @Column({
        type: 'enum',
        enum: AccumulationType,
        default: AccumulationType.CUSTOM
    })
    type: AccumulationType;

    @Column('bigint')
    nonce: bigint; // 사용자별 고유 nonce (순차 증가)

    @Column({
        type: 'enum',
        enum: AccumulationStatus,
        default: AccumulationStatus.PENDING
    })
    status: AccumulationStatus;

    @Column('varchar', { length: 66, nullable: true })
    claimTxHash: string | null;

    @Column('timestamp', { nullable: true })
    claimedAt: Date | null;

    @Column('timestamp', { nullable: true })
    expiresAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // 메타데이터 (JSON 형태로 저장)
    @Column('json', { nullable: true })
    metadata: Record<string, any> | null;
}
