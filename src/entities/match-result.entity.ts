import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SportCategory } from './sport-category.entity';
import { User } from './user.entity';

export enum MatchStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    EXPIRED = 'expired'
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
    myResult?: 'win' | 'lose' | 'draw';

    @Column({ type: 'boolean', name: 'is_handicap', default: false })
    isHandicap!: boolean;

    @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.PENDING })
    status!: MatchStatus;

    @Column({ type: 'timestamp', name: 'expired_time', nullable: false })
    expiredTime!: Date;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at', nullable: false })
    createdAt!: Date;
} 