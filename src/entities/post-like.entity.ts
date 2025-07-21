import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from './post.entity';

@Entity('post_like')
export class PostLike {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255, name: 'wallet_user_id', nullable: false })
    walletUserId!: string;

    @ManyToOne(() => Post, { nullable: false })
    @JoinColumn({ name: 'post_id' })
    post!: Post;

    @Column({ type: 'boolean', name: 'is_liked', nullable: true })
    isLiked?: boolean;
} 