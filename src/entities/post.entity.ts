import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Comment } from './comment.entity';
import { PostHate } from './post-hate.entity';
import { PostLike } from './post-like.entity';
import { SportCategory } from './sport-category.entity';
import { User } from './user.entity';

@Entity('post')
export class Post {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'author_id' })
    author!: User;

    @Column({ type: 'varchar', length: 255, nullable: true })
    content?: string;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at', nullable: false })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at', nullable: false })
    updatedAt!: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    title?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    type?: string;

    @Column({ type: 'boolean', name: 'is_hidden', default: false })
    isHidden?: boolean;

    @ManyToOne(() => SportCategory, { nullable: true })
    @JoinColumn({ name: 'sport_category_id' })
    sportCategory?: SportCategory;

    @OneToMany(() => Comment, (comment) => comment.post)
    comments?: Comment[];

    @OneToMany(() => PostLike, (like) => like.post)
    likes?: PostLike[];

    @OneToMany(() => PostHate, (hate) => hate.post)
    hates?: PostHate[];
} 