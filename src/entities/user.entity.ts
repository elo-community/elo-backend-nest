import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Address } from './address.entity';
import { Comment } from './comment.entity';
import { Post } from './post.entity';
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

    @CreateDateColumn({ type: 'timestamp', name: 'created_at', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'decimal', precision: 20, scale: 8, name: 'token_amount', nullable: true, default: 0 })
    tokenAmount!: number;

    @Column({ type: 'decimal', precision: 20, scale: 8, name: 'available_token', nullable: true, default: 0 })
    availableToken!: number;

    @Column({ type: 'varchar', length: 255, name: 'profile_image_url', nullable: true })
    profileImageUrl?: string;

    @OneToMany(() => Address, (address) => address.user, { cascade: true, eager: true })
    addresses?: Address[];

    @OneToMany(() => Comment, (comment) => comment.user)
    comments?: Comment[];

    @OneToMany(() => Post, (post) => post.author)
    posts?: Post[];

    addAddress(address: Address) {
        if (!this.addresses) {
            this.addresses = [];
        }
        this.addresses.push(address);
    }

    setAddresses(addresses: Address[]) {
        this.addresses = addresses;
    }
} 