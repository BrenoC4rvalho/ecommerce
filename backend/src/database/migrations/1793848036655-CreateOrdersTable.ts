import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersTable1793848036655 implements MigrationInterface {
  name = 'CreateOrdersTable1793848036655';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cart_id" uuid NOT NULL,
        "customer_email" character varying(255) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'CONFIRMED',
        "total_amount" numeric(12,2) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_orders_cart_id" UNIQUE ("cart_id"),
        CONSTRAINT "CHK_orders_status_valid" CHECK ("status" IN ('CONFIRMED', 'CANCELLED')),
        CONSTRAINT "CHK_orders_total_amount_nonnegative" CHECK ("total_amount" >= 0),
        CONSTRAINT "FK_orders_cart_id" FOREIGN KEY ("cart_id") REFERENCES "carts"("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "orders"');
  }
}
