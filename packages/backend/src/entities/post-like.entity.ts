import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity('post_like')
export class PostLike {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => Post, { nullable: false })
    @JoinColumn({ name: 'post_id' })
    post!: Post;

    @Column({ type: 'boolean', name: 'is_liked', nullable: true })
    isLiked?: boolean;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at', nullable: false })
    createdAt!: Date;
} 