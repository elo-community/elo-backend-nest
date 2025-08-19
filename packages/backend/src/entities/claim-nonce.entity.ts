import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('claim_nonce')
@Index(['walletAddress'], { unique: true })
export class ClaimNonce {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 42, unique: true })
    walletAddress: string;

    @Column({ type: 'bigint', default: 0 })
    currentNonce: bigint;

    @Column({ type: 'bigint', default: 0 })
    lastUsedNonce: bigint;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
