import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CartStatus {
  ACTIVE = 'ACTIVE',
  CHECKED_OUT = 'CHECKED_OUT',
}

@Entity('carts')
@Check('CHK_carts_status_valid', `"status" IN ('ACTIVE', 'CHECKED_OUT')`)
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'session_id', type: 'uuid', unique: true })
  sessionId!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: CartStatus.ACTIVE,
  })
  status!: CartStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
