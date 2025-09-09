import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sport_category')
export class SportCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'int', name: 'sort_order', nullable: true })
  sortOrder?: number;
}
