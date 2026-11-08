import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrderConfirmationTemplateService } from './order-confirmation-template.service';
import { MailConfigurationService } from './mail-configuration.service';
import { MailTransportService } from './mail-transport.service';
import { EmailOutbox, EmailOutboxStatus } from './entities/email-outbox.entity';

type ClaimedOutbox = { id: string; processingToken: string };
type ClaimedOutboxRow = { id: string; processing_token: string };
type MailFailure = {
  category: string;
  code?: string;
  responseCode?: number;
  command?: string;
  message: string;
};

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
    const result: unknown = await this.dataSource.transaction((manager) =>
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

    const rows =
      Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;

    if (!Array.isArray(rows)) return [];

    return rows.flatMap((row): ClaimedOutbox[] => {
      if (!this.isClaimedOutboxRow(row)) return [];

      return [{ id: row.id, processingToken: row.processing_token }];
    });
  }

  private isClaimedOutboxRow(value: unknown): value is ClaimedOutboxRow {
    if (!value || typeof value !== 'object') return false;
    const row = value as Record<string, unknown>;
    return (
      typeof row.id === 'string' && typeof row.processing_token === 'string'
    );
  }

  private async processClaim(claim: ClaimedOutbox): Promise<void> {
    const outbox = await this.dataSource.getRepository(EmailOutbox).findOne({
      where: {
        id: claim.id,
        status: EmailOutboxStatus.PROCESSING,
        processingToken: claim.processingToken,
      },
      relations: { order: { items: true } },
    });
    if (!outbox) return;

    try {
      const rendered = this.template.render(outbox.order);
      await this.transport.send({ recipient: outbox.recipient, ...rendered });
      await this.markSent(claim);
    } catch (error) {
      await this.markFailedAttempt(
        claim,
        outbox.attempts,
        this.describeFailure(error),
      );
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
      .where(
        'id = :id AND status = :status AND processing_token = :processingToken',
        {
          id: claim.id,
          status: EmailOutboxStatus.PROCESSING,
          processingToken: claim.processingToken,
        },
      )
      .execute();
  }

  private async markFailedAttempt(
    claim: ClaimedOutbox,
    attempts: number,
    failure: MailFailure,
  ): Promise<void> {
    const failed = attempts >= 5;
    await this.dataSource
      .createQueryBuilder()
      .update(EmailOutbox)
      .set({
        status: failed ? EmailOutboxStatus.FAILED : EmailOutboxStatus.PENDING,
        nextAttemptAt: failed
          ? new Date()
          : new Date(Date.now() + this.retryDelayMs(attempts)),
        processingStartedAt: null,
        processingToken: null,
        lastError: failure.message,
      })
      .where(
        'id = :id AND status = :status AND processing_token = :processingToken',
        {
          id: claim.id,
          status: EmailOutboxStatus.PROCESSING,
          processingToken: claim.processingToken,
        },
      )
      .execute();

    this.logger.warn(
      JSON.stringify({
        event: 'email_outbox_delivery_failed',
        outboxId: claim.id,
        attempt: attempts,
        ...this.transport.connectionInfo(),
        category: failure.category,
        ...(failure.code ? { code: failure.code } : {}),
        ...(failure.responseCode ? { responseCode: failure.responseCode } : {}),
        ...(failure.command ? { command: failure.command } : {}),
        message: failure.message,
      }),
    );
  }

  private retryDelayMs(attempts: number): number {
    const delays = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000];
    return delays[attempts - 1] ?? delays[delays.length - 1];
  }

  private describeFailure(error: unknown): MailFailure {
    const smtpError = error as Error & {
      code?: unknown;
      responseCode?: unknown;
      response?: unknown;
      command?: unknown;
    };
    const code =
      typeof smtpError.code === 'string' ? smtpError.code : undefined;
    const responseCode =
      typeof smtpError.responseCode === 'number'
        ? smtpError.responseCode
        : undefined;
    const command =
      typeof smtpError.command === 'string' ? smtpError.command : undefined;
    const source =
      typeof smtpError.response === 'string'
        ? smtpError.response
        : error instanceof Error
          ? error.message
          : 'SMTP delivery failed';
    const message = this.sanitizeError(source);
    const category = this.classifyFailure(code, responseCode, command, message);

    return {
      category,
      ...(code ? { code } : {}),
      ...(responseCode ? { responseCode } : {}),
      ...(command ? { command } : {}),
      message: `[${category}]${code ? ` ${code}` : ''}${responseCode ? ` ${responseCode}` : ''} ${message}`,
    };
  }

  private classifyFailure(
    code: string | undefined,
    responseCode: number | undefined,
    command: string | undefined,
    message: string,
  ): string {
    if (code === 'EAUTH' || responseCode === 535) return 'authentication';
    if (code?.startsWith('ECONN') || code === 'ETIMEDOUT') return 'connection';
    if (code?.startsWith('ESOCKET') || /tls|certificate|ssl/i.test(message))
      return 'tls';
    if (
      command?.startsWith('MAIL FROM') ||
      /sender|from address/i.test(message)
    )
      return 'sender';
    if (command?.startsWith('RCPT TO') || /recipient|to address/i.test(message))
      return 'recipient';
    return 'unknown';
  }

  private sanitizeError(message: string): string {
    return message
      .replace(/(pass(word)?|secret|token)\s*[=:]\s*\S+/gi, '$1=[redacted]')
      .replace(/re_[A-Za-z0-9_-]+/g, 're_[redacted]')
      .replace(/:\/\/[^\s:@]+:[^\s@]+@/g, '://[redacted]@')
      .slice(0, 1000);
  }
}
