import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCartsTable1793847920505 implements MigrationInterface {
  name = 'CreateCartsTable1793847920505';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "carts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_carts_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_carts_session_id" UNIQUE ("session_id"),
        CONSTRAINT "CHK_carts_status_valid" CHECK ("status" IN ('ACTIVE', 'CHECKED_OUT'))
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "carts"');
  }
}
