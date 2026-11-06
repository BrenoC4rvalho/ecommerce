import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

export enum EmailOutboxStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum EmailEventType {
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
}

@Entity('email_outbox')
@Unique('UQ_email_outbox_order_id_event_type', ['orderId', 'eventType'])
@Index('IDX_email_outbox_status_next_attempt_at', ['status', 'nextAttemptAt'])
@Index('IDX_email_outbox_status_processing_started_at', ['status', 'processingStartedAt'])
@Check('CHK_email_outbox_status_valid', `"status" IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED')`)
@Check('CHK_email_outbox_attempts_nonnegative', '"attempts" >= 0')
export class EmailOutbox {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'varchar', length: 255 })
  recipient!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType!: EmailEventType;

  @Column({ type: 'varchar', length: 20, default: EmailOutboxStatus.PENDING })
  status!: EmailOutboxStatus;

  @Column({ type: 'integer', default: 0 })
  attempts!: number;

  @Column({ name: 'next_attempt_at', type: 'timestamptz', default: () => 'now()' })
  nextAttemptAt!: Date;

  @Column({ name: 'processing_started_at', type: 'timestamptz', nullable: true })
  processingStartedAt!: Date | null;

  @Column({ name: 'processing_token', type: 'uuid', nullable: true })
  processingToken!: string | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt!: Date | null;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
