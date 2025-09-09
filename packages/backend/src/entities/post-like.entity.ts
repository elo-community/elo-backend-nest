import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity('post_like')
export class PostLike {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'int', name: 'user_id', nullable: false })
  userId!: number;

  @ManyToOne(() => Post, { nullable: false })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @Column({ type: 'int', name: 'post_id', nullable: false })
  postId!: number;

  @Column({ type: 'boolean', name: 'is_liked', nullable: true })
  isLiked?: boolean;

  @Column({ type: 'varchar', length: 255, name: 'transaction_hash', nullable: true })
  transactionHash?: string;

  @Column({ type: 'boolean', name: 'token_deducted', nullable: true, default: false })
  tokenDeducted?: boolean;

  @Column({ type: 'timestamp', name: 'token_deducted_at', nullable: true })
  tokenDeductedAt?: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', nullable: false })
  createdAt!: Date;
}
