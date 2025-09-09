import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Comment } from './comment.entity';
import { User } from './user.entity';

@Entity('comment_like')
export class CommentLike {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Comment, { nullable: false })
  @JoinColumn({ name: 'comment_id' })
  comment!: Comment;

  @Column({ type: 'boolean', name: 'is_liked', nullable: true })
  isLiked?: boolean;
}
