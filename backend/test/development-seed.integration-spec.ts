import { Client } from 'pg';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../src/database/data-source';
import { DevelopmentSeedService } from '../src/modules/development-seed/development-seed.service';
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
  const exists = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [testDatabase],
  );
  if (exists.rowCount === 0)
    await client.query(`CREATE DATABASE "${testDatabase}"`);
  await client.end();
}

describe('development product seed integration', () => {
  beforeAll(async () => {
    await createDatabaseIfNeeded();
    dataSource = new DataSource({
      ...AppDataSource.options,
      database: testDatabase,
    });
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE TABLE email_outbox, order_items, orders, cart_items, carts, products CASCADE',
    );
  });

  afterAll(async () => dataSource.destroy());

  it('inserts exactly 30 active products with positive stock into an empty database', async () => {
    await new DevelopmentSeedService(dataSource).seed('development');

    const products = await dataSource.getRepository(Product).find();

    expect(products).toHaveLength(30);
    expect(
      products.every(
        (product) =>
          product.isActive && product.stock > 0 && Number(product.price) > 0,
      ),
    ).toBe(true);
    expect(new Set(products.map((product) => product.name)).size).toBe(30);
  });

  it('does not duplicate products when executed again', async () => {
    const seed = new DevelopmentSeedService(dataSource);

    await seed.seed('development');
    await seed.seed('development');

    await expect(dataSource.getRepository(Product).count()).resolves.toBe(30);
  });

  it('does not modify a database that already has products', async () => {
    const existing = await dataSource.getRepository(Product).save({
      name: 'Existing product',
      description: null,
      price: '10.00',
      stock: 1,
      stockVersion: 0,
      isActive: true,
    });

    await new DevelopmentSeedService(dataSource).seed('development');

    await expect(dataSource.getRepository(Product).find()).resolves.toEqual([
      expect.objectContaining({ id: existing.id }),
    ]);
  });

  it('does not run outside development', async () => {
    await new DevelopmentSeedService(dataSource).seed('production');

    await expect(dataSource.getRepository(Product).count()).resolves.toBe(0);
  });

  it('does not duplicate products during concurrent initialization', async () => {
    const secondDataSource = new DataSource({
      ...AppDataSource.options,
      database: testDatabase,
    });
    await secondDataSource.initialize();

    try {
      await Promise.all([
        new DevelopmentSeedService(dataSource).seed('development'),
        new DevelopmentSeedService(secondDataSource).seed('development'),
      ]);
    } finally {
      await secondDataSource.destroy();
    }

    await expect(dataSource.getRepository(Product).count()).resolves.toBe(30);
  });
});
