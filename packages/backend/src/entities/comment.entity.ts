import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CommentLike } from './comment-like.entity';
import { Post } from './post.entity';
import { Reply } from './reply.entity';
import { User } from './user.entity';

@Entity('comment')
export class Comment {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.comments, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => Post, { nullable: false })
    @JoinColumn({ name: 'post_id' })
    post!: Post;

    @Column({ type: 'timestamp', name: 'created_at', nullable: false })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', nullable: false })
    updatedAt!: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    content!: string;

    @OneToMany(() => Reply, reply => reply.comment, { cascade: true })
    replies?: Reply[];

    @OneToMany(() => CommentLike, commentLike => commentLike.comment, { cascade: true })
    likes?: CommentLike[];
} 