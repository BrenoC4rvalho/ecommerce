import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStockVersionToProducts1793849968095 implements MigrationInterface {
  name = 'AddStockVersionToProducts1793849968095';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" ADD "stock_version" integer NOT NULL DEFAULT 0',
    );
    await queryRunner.query(
      'ALTER TABLE "products" ADD CONSTRAINT "CHK_products_stock_version_nonnegative" CHECK ("stock_version" >= 0)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" DROP CONSTRAINT "CHK_products_stock_version_nonnegative"',
    );
    await queryRunner.query(
      'ALTER TABLE "products" DROP COLUMN "stock_version"',
    );
  }
}
