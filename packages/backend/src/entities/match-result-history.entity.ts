import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MatchResult } from './match-result.entity';
import { User } from './user.entity';

@Entity('match_result_history')
export class MatchResultHistory {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => MatchResult, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'match_result_id' })
    matchResult!: MatchResult;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'a_user_id' })
    aUser!: User;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'b_user_id' })
    bUser!: User;

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: false, name: 'a_old' })
    aOld!: number;

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: false, name: 'a_new' })
    aNew!: number;

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: false, name: 'a_delta' })
    aDelta!: number;

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: false, name: 'b_old' })
    bOld!: number;

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: false, name: 'b_new' })
    bNew!: number;

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: false, name: 'b_delta' })
    bDelta!: number;

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: false, name: 'k_eff' })
    kEff!: number;

    @Column({ type: 'int', nullable: false, name: 'h2h_gap' })
    h2hGap!: number;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;
} 