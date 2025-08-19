import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { HotPost } from './hot-post.entity';
import { User } from './user.entity';

@Entity('hot_post_reward')
export class HotPostReward {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => HotPost, { nullable: false })
    @JoinColumn({ name: 'hot_post_id' })
    hotPost!: HotPost;

    @Column({ type: 'int', name: 'hot_post_id', nullable: false })
    hotPostId!: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ type: 'int', name: 'user_id', nullable: false })
    userId!: number;

    @Column({ type: 'decimal', precision: 20, scale: 8, name: 'reward_amount', nullable: false })
    rewardAmount!: number; // 해당 사용자가 받을 보상 금액

    @Column({ type: 'boolean', name: 'is_claimed', default: false })
    isClaimed!: boolean; // 보상 수확 여부

    @Column({ type: 'timestamp', name: 'claimed_at', nullable: true })
    claimedAt?: Date; // 보상 수확 시간

    @Column({ type: 'varchar', name: 'claim_tx_hash', length: 66, nullable: true })
    claimTxHash?: string; // 수확 트랜잭션 해시

    @CreateDateColumn({ type: 'timestamp', name: 'created_at', nullable: false })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at', nullable: false })
    updatedAt!: Date;
}
