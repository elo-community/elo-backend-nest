import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Comment } from './comment.entity';
import { Post } from './post.entity';
import { Reply } from './reply.entity';
import { UserElo } from './user-elo.entity';
// Address, Comment, Post 엔티티는 추후 생성/수정 예정

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  walletUserId!: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  walletAddress?: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  nickname?: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email?: string;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 8,
    name: 'token_amount',
    nullable: true,
    default: 0,
  })
  tokenAmount!: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 8,
    name: 'available_token',
    nullable: true,
    default: 0,
  })
  availableToken!: number;

  @Column({ type: 'timestamp', name: 'last_token_sync_at', nullable: true })
  lastTokenSyncAt?: Date;

  @Column({ type: 'varchar', length: 255, name: 'profile_image_url', nullable: true })
  profileImageUrl?: string;

  @Column({ type: 'varchar', length: 50, nullable: false, default: 'user' })
  role!: string; // 'user', 'admin', 'moderator' 등

  // 튜토리얼 완료 상태 추적
  @Column({ type: 'boolean', name: 'tutorial_first_post_completed', default: false })
  tutorialFirstPostCompleted!: boolean;

  @Column({ type: 'boolean', name: 'tutorial_first_match_completed', default: false })
  tutorialFirstMatchCompleted!: boolean;

  @Column({ type: 'timestamp', name: 'tutorial_first_post_completed_at', nullable: true })
  tutorialFirstPostCompletedAt?: Date;

  @Column({ type: 'timestamp', name: 'tutorial_first_match_completed_at', nullable: true })
  tutorialFirstMatchCompletedAt?: Date;

  @OneToMany(() => Comment, comment => comment.user)
  comments?: Comment[];

  @OneToMany(() => Post, post => post.author)
  posts?: Post[];

  @OneToMany(() => Reply, reply => reply.user)
  replies?: Reply[];

  @OneToMany(() => UserElo, userElo => userElo.user)
  userElos?: UserElo[];
}
