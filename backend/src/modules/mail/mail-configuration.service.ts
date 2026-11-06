import { Injectable } from '@nestjs/common';

export type MailProvider = 'mailpit' | 'smtp';

export type MailConfiguration = {
  provider: MailProvider;
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
  timeoutMs: number;
  batchSize: number;
  processingTimeoutSeconds: number;
};

@Injectable()
export class MailConfigurationService {
  readonly value: MailConfiguration;

  constructor() {
    const provider = this.readProvider();
    const secure = this.readBoolean('SMTP_SECURE', false);
    const port = this.readPositiveInteger('SMTP_PORT', provider === 'mailpit' ? 1025 : 587);
    const timeoutMs = this.readPositiveInteger('MAIL_SMTP_TIMEOUT_MS', 10_000);
    const batchSize = this.readPositiveInteger('MAIL_OUTBOX_BATCH_SIZE', 20);
    const processingTimeoutSeconds = this.readPositiveInteger('MAIL_PROCESSING_TIMEOUT_SECONDS', 120);
    const host = process.env.SMTP_HOST ?? (provider === 'mailpit' ? 'localhost' : '');
    const from = process.env.MAIL_FROM ?? 'E-commerce <no-reply@ecommerce.test>';
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;

    if (provider === 'smtp' && (!host || !user || !password || !from)) {
      throw new Error('Invalid SMTP configuration');
    }
    if (processingTimeoutSeconds * 1000 <= timeoutMs) {
      throw new Error('MAIL_PROCESSING_TIMEOUT_SECONDS must exceed MAIL_SMTP_TIMEOUT_MS');
    }

    this.value = { provider, host, port, secure, user, password, from, timeoutMs, batchSize, processingTimeoutSeconds };
  }

  private readProvider(): MailProvider {
    const provider = process.env.MAIL_PROVIDER ?? 'mailpit';
    if (provider === 'mailpit' || provider === 'smtp') return provider;
    throw new Error('MAIL_PROVIDER must be mailpit or smtp');
  }

  private readBoolean(key: string, fallback: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return fallback;
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new Error(`${key} must be true or false`);
  }

  private readPositiveInteger(key: string, fallback: number): number {
    const value = process.env[key];
    if (value === undefined) return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${key} must be a positive integer`);
    return parsed;
  }
}
