import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Product } from '../modules/products/entities/product.entity';
import { Cart } from '../modules/carts/entities/cart.entity';
import { CartItem } from '../modules/carts/entities/cart-item.entity';
import { Order } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/order-item.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'ecommerce',
  password: process.env.DB_PASSWORD ?? 'ecommerce_dev',
  database: process.env.DB_NAME ?? 'ecommerce',
  
  entities: [Product, Cart, CartItem, Order, OrderItem],

   migrations: [
    __dirname + '/migrations/*{.ts,.js}',
  ],
  
  synchronize: false,
});
