import { randomUUID } from 'crypto';
import { Client } from 'pg';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../src/database/data-source';
import { CartItem } from '../src/modules/carts/entities/cart-item.entity';
import { Cart, CartStatus } from '../src/modules/carts/entities/cart.entity';
import { CartsService } from '../src/modules/carts/carts.service';
import { OrdersService } from '../src/modules/orders/orders.service';
import { Order } from '../src/modules/orders/entities/order.entity';
import { Product } from '../src/modules/products/entities/product.entity';

const testDatabase = process.env.TEST_DB_NAME ?? 'ecommerce_test';
let dataSource: DataSource;
let cartsService: CartsService;

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

async function createCart(): Promise<Cart> {
  return dataSource.getRepository(Cart).save({ sessionId: randomUUID(), status: CartStatus.ACTIVE });
}

async function cartItem(cartId: string, productId: string): Promise<CartItem | null> {
  return dataSource.getRepository(CartItem).findOneBy({ cartId, productId });
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
    cartsService = new CartsService(dataSource, dataSource.getRepository(Cart));
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

  it('adds a quantity lower than the available stock without decrementing inventory', async () => {
    const product = await createProduct(5);
    const cart = await createCart();

    await cartsService.addItem(cart.id, cart.sessionId, { productId: product.id, quantity: 3 });

    expect(await cartItem(cart.id, product.id)).toMatchObject({ quantity: 3 });
    expect(await dataSource.getRepository(Product).findOneByOrFail({ id: product.id }))
      .toMatchObject({ stock: 5, stockVersion: 0 });
  });

  it('adds a quantity exactly equal to the available stock', async () => {
    const product = await createProduct(5);
    const cart = await createCart();

    await cartsService.addItem(cart.id, cart.sessionId, { productId: product.id, quantity: 5 });

    expect(await cartItem(cart.id, product.id)).toMatchObject({ quantity: 5 });
  });

  it('rejects an added quantity greater than stock without changing the cart', async () => {
    const product = await createProduct(5);
    const cart = await createCart();

    await expect(cartsService.addItem(cart.id, cart.sessionId, { productId: product.id, quantity: 6 }))
      .rejects.toMatchObject({
        status: 409,
        response: {
          message: 'Quantidade solicitada excede o estoque disponível',
          details: { productId: product.id, requestedQuantity: 6, availableQuantity: 5 },
        },
      });

    expect(await cartItem(cart.id, product.id)).toBeNull();
  });

  it('sums quantities for an existing cart item up to the stock limit', async () => {
    const product = await createProduct(5);
    const cart = await createCart();

    await cartsService.addItem(cart.id, cart.sessionId, { productId: product.id, quantity: 3 });
    await cartsService.addItem(cart.id, cart.sessionId, { productId: product.id, quantity: 2 });

    expect(await cartItem(cart.id, product.id)).toMatchObject({ quantity: 5 });
  });

  it('rejects an accumulated quantity above stock and preserves the existing item', async () => {
    const product = await createProduct(5);
    const cart = await createCart();
    await cartsService.addItem(cart.id, cart.sessionId, { productId: product.id, quantity: 3 });

    await expect(cartsService.addItem(cart.id, cart.sessionId, { productId: product.id, quantity: 3 }))
      .rejects.toMatchObject({ status: 409 });

    expect(await cartItem(cart.id, product.id)).toMatchObject({ quantity: 3 });
    expect(await dataSource.getRepository(Product).findOneByOrFail({ id: product.id }))
      .toMatchObject({ stock: 5, stockVersion: 0 });
  });

  it('updates an item quantity within the stock limit without decrementing inventory', async () => {
    const product = await createProduct(10);
    const cart = await createCartWithItem(product, 4);
    const item = await cartItem(cart.id, product.id);

    await cartsService.updateItem(cart.id, item!.id, cart.sessionId, { quantity: 8 });

    expect(await cartItem(cart.id, product.id)).toMatchObject({ quantity: 8 });
    expect(await dataSource.getRepository(Product).findOneByOrFail({ id: product.id }))
      .toMatchObject({ stock: 10, stockVersion: 0 });
  });

  it('rejects an item quantity above stock and preserves its previous quantity', async () => {
    const product = await createProduct(10);
    const cart = await createCartWithItem(product, 4);
    const item = await cartItem(cart.id, product.id);

    await expect(cartsService.updateItem(cart.id, item!.id, cart.sessionId, { quantity: 11 }))
      .rejects.toMatchObject({
        status: 409,
        response: {
          message: 'Quantidade solicitada excede o estoque disponível',
          details: { productId: product.id, requestedQuantity: 11, availableQuantity: 10 },
        },
      });

    expect(await cartItem(cart.id, product.id)).toMatchObject({ quantity: 4 });
  });

  it('serializes concurrent additions to the same cart and product at the stock limit', async () => {
    const product = await createProduct(5);
    const cart = await createCart();

    const results = await Promise.allSettled([
      cartsService.addItem(cart.id, cart.sessionId, { productId: product.id, quantity: 3 }),
      cartsService.addItem(cart.id, cart.sessionId, { productId: product.id, quantity: 3 }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(await cartItem(cart.id, product.id)).toMatchObject({ quantity: 3 });
    expect(await dataSource.getRepository(Product).findOneByOrFail({ id: product.id }))
      .toMatchObject({ stock: 5, stockVersion: 0 });
  });
});
