import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SportCategory } from './sport-category.entity';
import { User } from './user.entity';

export enum MatchStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled'
}

@Entity('match_result')
export class MatchResult {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'partner_id' })
    partner?: User;

    @ManyToOne(() => SportCategory, { nullable: false })
    @JoinColumn({ name: 'sport_category_id' })
    sportCategory!: SportCategory;

    @Column({ type: 'enum', enum: ['win', 'lose', 'draw'], nullable: true })
    senderResult?: 'win' | 'lose' | 'draw';

    @Column({ type: 'boolean', name: 'is_handicap', default: false })
    isHandicap!: boolean;

    @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.PENDING })
    status!: MatchStatus;

    @Column({ type: 'timestamp', name: 'expired_time', nullable: false })
    expiredTime!: Date;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at', nullable: false })
    createdAt!: Date;

    // New columns for Elo rating system
    @Column({ type: 'timestamp', name: 'played_at', nullable: false })
    playedAt!: Date;

    @Column({ type: 'date', name: 'played_date', nullable: false })
    playedDate!: Date;

    @Column({ type: 'timestamp', name: 'confirmed_at', nullable: true })
    confirmedAt?: Date;

    @Column({ type: 'enum', enum: ['win', 'lose', 'draw'], nullable: true, name: 'partner_result' })
    partnerResult?: 'win' | 'lose' | 'draw';

    @Column({ type: 'int', name: 'pair_user_lo', nullable: false })
    pairUserLo!: number;

    @Column({ type: 'int', name: 'pair_user_hi', nullable: false })
    pairUserHi!: number;

    // Elo rating change fields
    @Column({ type: 'int', name: 'elo_before', nullable: true })
    eloBefore?: number;

    @Column({ type: 'int', name: 'elo_after', nullable: true })
    eloAfter?: number;

    @Column({ type: 'int', name: 'elo_delta', nullable: true })
    eloDelta?: number;

    @Column({ type: 'int', name: 'partner_elo_before', nullable: true })
    partnerEloBefore?: number;

    @Column({ type: 'int', name: 'partner_elo_after', nullable: true })
    partnerEloAfter?: number;

    @Column({ type: 'int', name: 'partner_elo_delta', nullable: true })
    partnerEloDelta?: number;
} 