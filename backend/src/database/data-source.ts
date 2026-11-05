import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Product } from '../modules/products/entities/product.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'ecommerce',
  password: process.env.DB_PASSWORD ?? 'ecommerce_dev',
  database: process.env.DB_NAME ?? 'ecommerce',
  
  entities: [Product],

   migrations: [
    __dirname + '/migrations/*{.ts,.js}',
  ],
  
  synchronize: false,
});