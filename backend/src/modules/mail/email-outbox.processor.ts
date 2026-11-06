import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrderConfirmationTemplateService } from './order-confirmation-template.service';
import { MailConfigurationService } from './mail-configuration.service';
import { MailTransportService } from './mail-transport.service';
import { EmailOutbox, EmailOutboxStatus } from './entities/email-outbox.entity';

type ClaimedOutbox = { id: string; processingToken: string };

@Injectable()
export class EmailOutboxProcessor {
  private readonly logger = new Logger(EmailOutboxProcessor.name);
  private running = false;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configuration: MailConfigurationService,
    private readonly transport: MailTransportService,
    private readonly template: OrderConfirmationTemplateService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async scheduledProcess(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.runOnce();
    } finally {
      this.running = false;
    }
  }

  async runOnce(): Promise<void> {
    await this.recoverStaleProcessing();
    const claims = await this.claimPending();
    await Promise.all(claims.map((claim) => this.processClaim(claim)));
  }

  private async recoverStaleProcessing(): Promise<void> {
    await this.dataSource.query(
      `UPDATE email_outbox
       SET status = $1, processing_started_at = NULL, processing_token = NULL,
           next_attempt_at = now(), updated_at = now()
       WHERE status = $2
         AND processing_started_at < now() - ($3 * INTERVAL '1 second')`,
      [
        EmailOutboxStatus.PENDING,
        EmailOutboxStatus.PROCESSING,
        this.configuration.value.processingTimeoutSeconds,
      ],
    );
  }

  private async claimPending(): Promise<ClaimedOutbox[]> {
    const rows = await this.dataSource.transaction((manager) =>
      manager.query(
        `WITH candidates AS (
           SELECT id
           FROM email_outbox
           WHERE status = $1 AND next_attempt_at <= now()
           ORDER BY next_attempt_at ASC, created_at ASC
           FOR UPDATE SKIP LOCKED
           LIMIT $2
         )
         UPDATE email_outbox outbox
         SET status = $3,
             attempts = outbox.attempts + 1,
             processing_started_at = now(),
             processing_token = uuid_generate_v4(),
             updated_at = now()
         FROM candidates
         WHERE outbox.id = candidates.id
         RETURNING outbox.id, outbox.processing_token`,
        [
          EmailOutboxStatus.PENDING,
          this.configuration.value.batchSize,
          EmailOutboxStatus.PROCESSING,
        ],
      ),
    );

    return rows.map((row: { id: string; processing_token: string }) => ({
      id: row.id,
      processingToken: row.processing_token,
    }));
  }

  private async processClaim(claim: ClaimedOutbox): Promise<void> {
    const outbox = await this.dataSource.getRepository(EmailOutbox).findOne({
      where: { id: claim.id, status: EmailOutboxStatus.PROCESSING, processingToken: claim.processingToken },
      relations: { order: { items: true } },
    });
    if (!outbox) return;

    try {
      const rendered = this.template.render(outbox.order);
      await this.transport.send({ recipient: outbox.recipient, ...rendered });
      await this.markSent(claim);
    } catch (error) {
      await this.markFailedAttempt(claim, outbox.attempts, this.sanitizeError(error));
    }
  }

  private async markSent(claim: ClaimedOutbox): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .update(EmailOutbox)
      .set({
        status: EmailOutboxStatus.SENT,
        sentAt: new Date(),
        processingStartedAt: null,
        processingToken: null,
        lastError: null,
      })
      .where('id = :id AND status = :status AND processing_token = :processingToken', {
        id: claim.id,
        status: EmailOutboxStatus.PROCESSING,
        processingToken: claim.processingToken,
      })
      .execute();
  }

  private async markFailedAttempt(claim: ClaimedOutbox, attempts: number, lastError: string): Promise<void> {
    const failed = attempts >= 5;
    await this.dataSource
      .createQueryBuilder()
      .update(EmailOutbox)
      .set({
        status: failed ? EmailOutboxStatus.FAILED : EmailOutboxStatus.PENDING,
        nextAttemptAt: failed ? new Date() : new Date(Date.now() + this.retryDelayMs(attempts)),
        processingStartedAt: null,
        processingToken: null,
        lastError,
      })
      .where('id = :id AND status = :status AND processing_token = :processingToken', {
        id: claim.id,
        status: EmailOutboxStatus.PROCESSING,
        processingToken: claim.processingToken,
      })
      .execute();

    this.logger.warn(`Email outbox ${claim.id} delivery failed after attempt ${attempts}`);
  }

  private retryDelayMs(attempts: number): number {
    const delays = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000];
    return delays[attempts - 1] ?? delays[delays.length - 1];
  }

  private sanitizeError(error: unknown): string {
    const message = error instanceof Error ? error.message : 'SMTP delivery failed';
    return message
      .replace(/(pass(word)?|secret|token)\s*[=:]\s*\S+/gi, '$1=[redacted]')
      .replace(/:\/\/[^\s:@]+:[^\s@]+@/g, '://[redacted]@')
      .slice(0, 1000);
  }
}
