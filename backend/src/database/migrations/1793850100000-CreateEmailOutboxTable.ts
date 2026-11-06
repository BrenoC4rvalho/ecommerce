import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailOutboxTable1793850100000 implements MigrationInterface {
  name = 'CreateEmailOutboxTable1793850100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "email_outbox" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "recipient" character varying(255) NOT NULL,
        "event_type" character varying(100) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'PENDING',
        "attempts" integer NOT NULL DEFAULT 0,
        "next_attempt_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "processing_started_at" TIMESTAMP WITH TIME ZONE,
        "processing_token" uuid,
        "sent_at" TIMESTAMP WITH TIME ZONE,
        "last_error" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_outbox_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_email_outbox_order_id_event_type" UNIQUE ("order_id", "event_type"),
        CONSTRAINT "CHK_email_outbox_status_valid" CHECK ("status" IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED')),
        CONSTRAINT "CHK_email_outbox_attempts_nonnegative" CHECK ("attempts" >= 0),
        CONSTRAINT "FK_email_outbox_order_id" FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_email_outbox_status_next_attempt_at" ON "email_outbox" ("status", "next_attempt_at")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_email_outbox_status_processing_started_at" ON "email_outbox" ("status", "processing_started_at")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "email_outbox"');
  }
}
