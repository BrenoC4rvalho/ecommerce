import { randomUUID } from 'crypto';
import { Client } from 'pg';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../src/database/data-source';
import { CartItem } from '../src/modules/carts/entities/cart-item.entity';
import { Cart, CartStatus } from '../src/modules/carts/entities/cart.entity';
import { OrdersService } from '../src/modules/orders/orders.service';
import { Order } from '../src/modules/orders/entities/order.entity';
import { Product } from '../src/modules/products/entities/product.entity';

const testDatabase = process.env.TEST_DB_NAME ?? 'ecommerce_test';
let dataSource: DataSource;

async function createDatabaseIfNeeded() {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'ecommerce',
    password: process.env.DB_PASSWORD ?? 'ecommerce_dev',
    database: 'postgres',
  });
  await client.connect();
  const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [testDatabase]);
  if (exists.rowCount === 0) await client.query(`CREATE DATABASE "${testDatabase}"`);
  await client.end();
}

async function createProduct(stock: number): Promise<Product> {
  return dataSource.getRepository(Product).save({
    name: `Product ${randomUUID()}`,
    price: '10.00',
    stock,
    stockVersion: 0,
    isActive: true,
    description: null,
  });
}

async function createCartWithItem(product: Product, quantity: number) {
  const cart = await dataSource.getRepository(Cart).save({ sessionId: randomUUID(), status: CartStatus.ACTIVE });
  await dataSource.getRepository(CartItem).save({ cartId: cart.id, productId: product.id, quantity });
  return cart;
}

async function checkout(cart: Cart) {
  return new OrdersService(dataSource).checkout(cart.sessionId, {
    cartId: cart.id,
    customerEmail: `${randomUUID()}@example.com`,
  });
}

describe('inventory concurrency integration', () => {
  beforeAll(async () => {
    await createDatabaseIfNeeded();
    dataSource = new DataSource({ ...AppDataSource.options, database: testDatabase });
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE order_items, orders, cart_items, carts, products CASCADE');
  });

  afterAll(async () => dataSource.destroy());

  it('confirms only one checkout for the last unit', async () => {
    const product = await createProduct(1);
    const [first, second] = await Promise.all([
      createCartWithItem(product, 1),
      createCartWithItem(product, 1),
    ]);
    const results = await Promise.allSettled([checkout(first), checkout(second)]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect((await dataSource.getRepository(Product).findOneByOrFail({ id: product.id })).stock).toBe(0);
    expect((await dataSource.getRepository(Product).findOneByOrFail({ id: product.id })).stockVersion).toBe(1);
    expect(await dataSource.getRepository(Order).count()).toBe(1);
  });

  it('retries a version conflict when stock remains available', async () => {
    const product = await createProduct(10);
    const [first, second] = await Promise.all([
      createCartWithItem(product, 3),
      createCartWithItem(product, 3),
    ]);
    const listener = new Client({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      user: process.env.DB_USER ?? 'ecommerce',
      password: process.env.DB_PASSWORD ?? 'ecommerce_dev',
      database: testDatabase,
    });
    await listener.connect();
    await listener.query('LISTEN checkout_barrier');
    const barrierReached = new Promise<void>((resolve) => listener.once('notification', () => resolve()));
    await dataSource.query(`
      CREATE OR REPLACE FUNCTION checkout_test_barrier() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        PERFORM pg_notify('checkout_barrier', 'stock-update-started');
        PERFORM pg_sleep(0.2);
        RETURN NEW;
      END;
      $$;
      CREATE TRIGGER checkout_test_barrier_trigger BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION checkout_test_barrier();
    `);

    try {
      const firstCheckout = checkout(first);
      await barrierReached;
      await expect(Promise.all([firstCheckout, checkout(second)])).resolves.toHaveLength(2);
    } finally {
      await dataSource.query('DROP TRIGGER IF EXISTS checkout_test_barrier_trigger ON products');
      await dataSource.query('DROP FUNCTION IF EXISTS checkout_test_barrier()');
      await listener.end();
    }

    const stored = await dataSource.getRepository(Product).findOneByOrFail({ id: product.id });
    expect(stored.stock).toBe(4);
    expect(stored.stockVersion).toBe(2);
    expect(await dataSource.getRepository(Order).count()).toBe(2);
  });

  it('never allows negative stock after a conflict', async () => {
    const product = await createProduct(5);
    const [first, second] = await Promise.all([
      createCartWithItem(product, 4),
      createCartWithItem(product, 4),
    ]);
    const results = await Promise.allSettled([checkout(first), checkout(second)]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect((await dataSource.getRepository(Product).findOneByOrFail({ id: product.id })).stock).toBe(1);
  });

  it('rolls back every stock change when one product is insufficient', async () => {
    const available = await createProduct(3);
    const insufficient = await createProduct(0);
    const cart = await createCartWithItem(available, 1);
    await dataSource.getRepository(CartItem).save({ cartId: cart.id, productId: insufficient.id, quantity: 1 });

    await expect(checkout(cart)).rejects.toMatchObject({ status: 409 });
    expect((await dataSource.getRepository(Product).findOneByOrFail({ id: available.id })).stock).toBe(3);
    expect(await dataSource.getRepository(Order).count()).toBe(0);
    expect((await dataSource.getRepository(Cart).findOneByOrFail({ id: cart.id })).status).toBe(CartStatus.ACTIVE);
  });

  it('creates one order for duplicate checkout requests', async () => {
    const product = await createProduct(2);
    const cart = await createCartWithItem(product, 1);
    const results = await Promise.allSettled([checkout(cart), checkout(cart)]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(await dataSource.getRepository(Order).count()).toBe(1);
    expect((await dataSource.getRepository(Product).findOneByOrFail({ id: product.id })).stock).toBe(1);
  });

  it('increments stock version for an administrative stock update', async () => {
    const product = await createProduct(2);
    await dataSource.query(
      'UPDATE products SET stock = $1, stock_version = stock_version + 1 WHERE id = $2',
      [5, product.id],
    );
    const stored = await dataSource.getRepository(Product).findOneByOrFail({ id: product.id });
    expect(stored).toMatchObject({ stock: 5, stockVersion: 1 });
  });
});
