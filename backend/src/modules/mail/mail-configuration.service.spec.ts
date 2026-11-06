import { MailConfigurationService } from './mail-configuration.service';

const mailKeys = [
  'MAIL_PROVIDER',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'MAIL_FROM',
  'MAIL_SMTP_TIMEOUT_MS',
  'MAIL_OUTBOX_BATCH_SIZE',
  'MAIL_PROCESSING_TIMEOUT_SECONDS',
];

describe('MailConfigurationService', () => {
  const original = new Map<string, string | undefined>();

  beforeEach(() => {
    mailKeys.forEach((key) => original.set(key, process.env[key]));
    mailKeys.forEach((key) => delete process.env[key]);
  });

  afterEach(() => {
    mailKeys.forEach((key) => {
      const value = original.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });

  it('defaults development delivery to local Mailpit', () => {
    expect(new MailConfigurationService().value).toMatchObject({
      provider: 'mailpit',
      host: 'localhost',
      port: 1025,
      secure: false,
    });
  });

  it('requires complete real SMTP credentials without revealing their values', () => {
    process.env.MAIL_PROVIDER = 'smtp';
    process.env.SMTP_PASSWORD = 'do-not-log-me';

    expect(() => new MailConfigurationService()).toThrow('Invalid SMTP configuration');
    expect(() => new MailConfigurationService()).not.toThrow('do-not-log-me');
  });
});
