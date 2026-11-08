import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cart } from '../../carts/entities/cart.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

@Entity('orders')
@Check('CHK_orders_status_valid', `"status" IN ('CONFIRMED', 'CANCELLED')`)
@Check('CHK_orders_total_amount_nonnegative', '"total_amount" >= 0')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_number', type: 'varchar', length: 32, unique: true, update: false })
  orderNumber!: string;

  @Column({ name: 'cart_id', type: 'uuid', unique: true })
  cartId!: string;

  @OneToOne(() => Cart)
  @JoinColumn({ name: 'cart_id' })
  cart!: Cart;

  @Column({ name: 'customer_email', type: 'varchar', length: 255 })
  customerEmail!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: OrderStatus.CONFIRMED,
  })
  status!: OrderStatus;

  @Column({
    name: 'total_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  totalAmount!: string;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  items!: OrderItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
