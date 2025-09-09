import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './post.entity';

@Entity('hot_post')
export class HotPost {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Post, { nullable: false })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @Column({ type: 'int', name: 'post_id', nullable: false })
  postId!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'popularity_score', nullable: false })
  popularityScore!: number;

  @Column({ type: 'int', name: 'rank', nullable: false })
  rank!: number; // 1, 2, 3 순위

  @Column({ type: 'date', name: 'selection_date', nullable: false })
  selectionDate!: Date; // 선정된 날짜

  @Column({ type: 'boolean', name: 'is_rewarded', default: false })
  isRewarded!: boolean; // 보상 지급 여부

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', nullable: false })
  createdAt!: Date;

  // 보상 지급 시 사용할 필드들
  @Column({ type: 'decimal', precision: 20, scale: 8, name: 'reward_amount', nullable: true })
  rewardAmount?: number; // 지급된 보상 금액

  @Column({ type: 'timestamp', name: 'rewarded_at', nullable: true })
  rewardedAt?: Date; // 보상 지급 시간
}
