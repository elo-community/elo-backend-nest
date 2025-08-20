import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';

export enum MatchRequestStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    CANCELLED = 'cancelled'
}

@Entity('match_requests')
export class MatchRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Post, { nullable: false })
    @JoinColumn({ name: 'post_id' })
    post!: Post;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({
        type: 'enum',
        enum: MatchRequestStatus,
        default: MatchRequestStatus.PENDING
    })
    status!: MatchRequestStatus;

    @Column({ type: 'text', nullable: true })
    message?: string;

    @Column({ type: 'int', nullable: true })
    userElo?: number;

    @Column({ type: 'timestamp', nullable: true })
    respondedAt?: Date;

    @Column({ type: 'text', nullable: true })
    responseMessage?: string;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at', nullable: false })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at', nullable: false })
    updatedAt!: Date;
}
