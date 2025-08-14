import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SportCategory } from './sport-category.entity';
import { User } from './user.entity';

@Entity('user_elo')
export class UserElo {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => SportCategory, { nullable: false })
    @JoinColumn({ name: 'sport_category_id' })
    sportCategory!: SportCategory;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ type: 'int', name: 'elo_point', nullable: false, default: 1400 })
    eloPoint!: number;

    @Column({ type: 'varchar', length: 50, nullable: false, default: 'BRONZE' })
    tier!: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false, default: 50.00 })
    percentile!: number;

    @Column({ type: 'int', name: 'wins', nullable: false, default: 0 })
    wins!: number;

    @Column({ type: 'int', name: 'losses', nullable: false, default: 0 })
    losses!: number;

    @Column({ type: 'int', name: 'draws', nullable: false, default: 0 })
    draws!: number;

    @Column({ type: 'int', name: 'total_matches', nullable: false, default: 0 })
    totalMatches!: number;
} 