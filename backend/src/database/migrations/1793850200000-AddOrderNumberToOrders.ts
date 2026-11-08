import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderNumberToOrders1793850200000 implements MigrationInterface {
  name = 'AddOrderNumberToOrders1793850200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE SEQUENCE "orders_order_number_seq"');
    await queryRunner.query(
      'ALTER TABLE "orders" ADD "order_number" character varying(32)',
    );
    await queryRunner.query(
      `UPDATE "orders" SET "order_number" = 'PED-' || to_char("created_at" AT TIME ZONE 'America/Sao_Paulo', 'YYYY') || '-' || lpad(nextval('orders_order_number_seq')::text, 6, '0') WHERE "order_number" IS NULL`,
    );
    await queryRunner.query(
      'ALTER TABLE "orders" ALTER COLUMN "order_number" SET NOT NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_orders_order_number" ON "orders" ("order_number")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "UQ_orders_order_number"');
    await queryRunner.query('ALTER TABLE "orders" DROP COLUMN "order_number"');
    await queryRunner.query('DROP SEQUENCE "orders_order_number_seq"');
  }
}
