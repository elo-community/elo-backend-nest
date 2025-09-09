import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Comment } from './comment.entity';
import { PostHate } from './post-hate.entity';
import { PostLike } from './post-like.entity';
import { SportCategory } from './sport-category.entity';
import { User } from './user.entity';

export enum PostType {
  GENERAL = 'general',
  MATCH = 'match',
}

@Entity('post')
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at', nullable: false })
  updatedAt!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string;

  @Column({
    type: 'enum',
    enum: PostType,
    default: PostType.GENERAL,
  })
  type!: PostType;

  @Column({ type: 'boolean', name: 'is_hidden', default: false })
  isHidden?: boolean;

  @Column({ type: 'int', name: 'view_count', default: 0 })
  viewCount!: number;

  @ManyToOne(() => SportCategory, { nullable: true })
  @JoinColumn({ name: 'sport_category_id' })
  sportCategory?: SportCategory;

  @OneToMany(() => Comment, comment => comment.post, { cascade: true })
  comments?: Comment[];

  @OneToMany(() => PostLike, like => like.post, { cascade: true })
  likes?: PostLike[];

  @OneToMany(() => PostHate, hate => hate.post, { cascade: true })
  hates?: PostHate[];

  @Column({ type: 'json', nullable: true })
  imageUrls?: string[];

  // 매치글 관련 필드들 (일반글에서는 null)
  @Column({ type: 'varchar', length: 255, nullable: true })
  matchLocation?: string;

  @Column({ type: 'int', nullable: true })
  myElo?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  preferredElo?: string; // 'similar', 'any', 'higher', 'lower'

  @Column({ type: 'int', nullable: true })
  participantCount?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  matchStatus?: string; // '대기중', '모집완료', '매치완료', '취소됨'

  @Column({ type: 'timestamp', nullable: true })
  deadline?: Date;

  @Column({ type: 'timestamp', nullable: true })
  matchDate?: Date;

  // 매치글인지 확인하는 메서드
  isMatchPost(): boolean {
    return this.type === PostType.MATCH;
  }

  // 일반글인지 확인하는 메서드
  isGeneralPost(): boolean {
    return this.type === PostType.GENERAL;
  }
}
