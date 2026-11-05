import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderItemsTable1793848094545 implements MigrationInterface {
  name = 'CreateOrderItemsTable1793848094545';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "product_name" character varying(150) NOT NULL,
        "quantity" integer NOT NULL,
        "unit_price" numeric(12,2) NOT NULL,
        "subtotal" numeric(12,2) GENERATED ALWAYS AS (("unit_price" * "quantity")::numeric(12,2)) STORED,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_order_items_quantity_positive" CHECK ("quantity" > 0),
        CONSTRAINT "CHK_order_items_unit_price_nonnegative" CHECK ("unit_price" >= 0),
        CONSTRAINT "CHK_order_items_subtotal_nonnegative" CHECK ("subtotal" >= 0),
        CONSTRAINT "FK_order_items_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id"),
        CONSTRAINT "FK_order_items_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_order_items_order_id" ON "order_items" ("order_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_order_items_product_id" ON "order_items" ("product_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "order_items"');
  }
}
