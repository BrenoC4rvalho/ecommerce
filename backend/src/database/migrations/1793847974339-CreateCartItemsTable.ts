import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCartItemsTable1793847974339 implements MigrationInterface {
  name = 'CreateCartItemsTable1793847974339';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "cart_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cart_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cart_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cart_items_cart_id_product_id" UNIQUE ("cart_id", "product_id"),
        CONSTRAINT "CHK_cart_items_quantity_positive" CHECK ("quantity" > 0),
        CONSTRAINT "FK_cart_items_cart_id" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cart_items_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_cart_items_cart_id" ON "cart_items" ("cart_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_cart_items_product_id" ON "cart_items" ("product_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "cart_items"');
  }
}
