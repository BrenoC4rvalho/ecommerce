import { randomUUID } from 'crypto';
import { Client } from 'pg';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../src/database/data-source';
import { Cart, CartStatus } from '../src/modules/carts/entities/cart.entity';
import {
  EmailEventType,
  EmailOutbox,
  EmailOutboxStatus,
} from '../src/modules/mail/entities/email-outbox.entity';
import { EmailOutboxProcessor } from '../src/modules/mail/email-outbox.processor';
import { MailConfigurationService } from '../src/modules/mail/mail-configuration.service';
import { MailTransportService } from '../src/modules/mail/mail-transport.service';
import { OrderConfirmationTemplateService } from '../src/modules/mail/order-confirmation-template.service';
import {
  Order,
  OrderStatus,
} from '../src/modules/orders/entities/order.entity';
import { OrderItem } from '../src/modules/orders/entities/order-item.entity';
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

async function createOutbox(
  overrides: Partial<EmailOutbox> = {},
): Promise<EmailOutbox> {
  const product = await dataSource.getRepository(Product).save({
    name: `Historical ${randomUUID()}`,
    description: null,
    price: '10.00',
    stock: 10,
    stockVersion: 0,
    isActive: true,
  });
  const cart = await dataSource
    .getRepository(Cart)
    .save({ sessionId: randomUUID(), status: CartStatus.CHECKED_OUT });
  const order = await dataSource.getRepository(Order).save({
    orderNumber: `PED-2026-${randomUUID().replace(/-/g, '').slice(0, 6)}`,
    cartId: cart.id,
    customerEmail: 'buyer@example.com',
    status: OrderStatus.CONFIRMED,
    totalAmount: '20.00',
  });
  await dataSource.getRepository(OrderItem).save({
    orderId: order.id,
    productId: product.id,
    productName: '<Historical item>',
    quantity: 2,
    unitPrice: '10.00',
  });
  return dataSource.getRepository(EmailOutbox).save({
    orderId: order.id,
    recipient: order.customerEmail,
    eventType: EmailEventType.ORDER_CONFIRMATION,
    status: EmailOutboxStatus.PENDING,
    attempts: 0,
    nextAttemptAt: new Date(),
    processingStartedAt: null,
    processingToken: null,
    sentAt: null,
    lastError: null,
    ...overrides,
  });
}

function processor(send: jest.Mock): EmailOutboxProcessor {
  return new EmailOutboxProcessor(
    dataSource,
    new MailConfigurationService(),
    {
      send,
      connectionInfo: () => ({
        provider: 'smtp',
        host: 'smtp.test',
        port: 465,
        secure: true,
      }),
    } as unknown as MailTransportService,
    new OrderConfirmationTemplateService(),
  );
}

describe('email outbox processor integration', () => {
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

  it('sends a pending notification and marks it SENT', async () => {
    const outbox = await createOutbox();
    const send = jest.fn().mockResolvedValue(undefined);

    await processor(send).runOnce();

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].html).toContain('&lt;Historical item&gt;');
    expect(send.mock.calls[0][0].text).toContain('R$\u00a020,00');
    expect(
      await dataSource
        .getRepository(EmailOutbox)
        .findOneByOrFail({ id: outbox.id }),
    ).toMatchObject({
      status: EmailOutboxStatus.SENT,
      attempts: 1,
      lastError: null,
    });
  });

  it('retries an SMTP failure after one minute without undoing the order', async () => {
    const outbox = await createOutbox();
    const send = jest.fn().mockRejectedValue(new Error('SMTP unavailable'));
    const before = Date.now();

    await processor(send).runOnce();

    const stored = await dataSource
      .getRepository(EmailOutbox)
      .findOneByOrFail({ id: outbox.id });
    expect(stored.status).toBe(EmailOutboxStatus.PENDING);
    expect(stored.attempts).toBe(1);
    expect(stored.nextAttemptAt.getTime()).toBeGreaterThanOrEqual(
      before + 59_000,
    );
    expect(stored.lastError).toBe('[unknown] SMTP unavailable');
    expect(await dataSource.getRepository(Order).count()).toBe(1);
  });

  it.each([
    [1, 5 * 60_000],
    [2, 15 * 60_000],
    [3, 60 * 60_000],
  ])(
    'uses the configured backoff after failed attempt %i',
    async (priorAttempts, delayMs) => {
      const outbox = await createOutbox({ attempts: priorAttempts });
      const send = jest.fn().mockRejectedValue(new Error('SMTP unavailable'));
      const before = Date.now();

      await processor(send).runOnce();

      const stored = await dataSource
        .getRepository(EmailOutbox)
        .findOneByOrFail({ id: outbox.id });
      expect(stored.attempts).toBe(priorAttempts + 1);
      expect(stored.nextAttemptAt.getTime()).toBeGreaterThanOrEqual(
        before + delayMs - 1_000,
      );
    },
  );

  it('marks the fifth failed delivery as FAILED and never reclaims it', async () => {
    const outbox = await createOutbox({ attempts: 4 });
    const send = jest.fn().mockRejectedValue(new Error('SMTP unavailable'));
    const worker = processor(send);

    await worker.runOnce();
    await worker.runOnce();

    expect(send).toHaveBeenCalledTimes(1);
    expect(
      await dataSource
        .getRepository(EmailOutbox)
        .findOneByOrFail({ id: outbox.id }),
    ).toMatchObject({ status: EmailOutboxStatus.FAILED, attempts: 5 });
  });

  it('does not process notifications whose next attempt is in the future', async () => {
    const outbox = await createOutbox({
      nextAttemptAt: new Date(Date.now() + 60 * 60_000),
    });
    const send = jest.fn();

    await processor(send).runOnce();

    expect(send).not.toHaveBeenCalled();
    expect(
      (
        await dataSource
          .getRepository(EmailOutbox)
          .findOneByOrFail({ id: outbox.id })
      ).status,
    ).toBe(EmailOutboxStatus.PENDING);
  });

  it('allows only one worker to claim the same notification', async () => {
    const outbox = await createOutbox();
    const send = jest.fn().mockResolvedValue(undefined);

    await Promise.all([processor(send).runOnce(), processor(send).runOnce()]);

    expect(send).toHaveBeenCalledTimes(1);
    expect(
      (
        await dataSource
          .getRepository(EmailOutbox)
          .findOneByOrFail({ id: outbox.id })
      ).status,
    ).toBe(EmailOutboxStatus.SENT);
  });

  it('commits the claim before waiting for SMTP network delivery', async () => {
    const outbox = await createOutbox();
    let release!: () => void;
    let started!: () => void;
    const startedSending = new Promise<void>((resolve) => {
      started = resolve;
    });
    const send = jest.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
          started();
        }),
    );
    const execution = processor(send).runOnce();
    await startedSending;

    expect(send).toHaveBeenCalledTimes(1);
    expect(
      (
        await dataSource
          .getRepository(EmailOutbox)
          .findOneByOrFail({ id: outbox.id })
      ).status,
    ).toBe(EmailOutboxStatus.PROCESSING);

    release();
    await execution;
  });

  it('recovers an abandoned PROCESSING notification', async () => {
    const outbox = await createOutbox({
      status: EmailOutboxStatus.PROCESSING,
      processingToken: randomUUID(),
      processingStartedAt: new Date(Date.now() - 121_000),
    });
    const send = jest.fn().mockResolvedValue(undefined);

    await processor(send).runOnce();

    expect(send).toHaveBeenCalledTimes(1);
    expect(
      await dataSource
        .getRepository(EmailOutbox)
        .findOneByOrFail({ id: outbox.id }),
    ).toMatchObject({ status: EmailOutboxStatus.SENT, attempts: 1 });
  });
});
