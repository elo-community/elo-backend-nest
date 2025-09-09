import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Comment } from './comment.entity';
import { User } from './user.entity';

@Entity('reply')
export class Reply {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Comment, { nullable: false })
  @JoinColumn({ name: 'comment_id' })
  comment!: Comment;

  @Column({ type: 'timestamp', name: 'created_at', nullable: false })
  createdAt!: Date;

  @Column({ type: 'timestamp', name: 'updated_at', nullable: false })
  updatedAt!: Date;

  @Column({ type: 'text', nullable: true })
  content?: string;
}
