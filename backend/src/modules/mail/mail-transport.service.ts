import { Injectable } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { MailConfiguration, MailConfigurationService } from './mail-configuration.service';

export type OutgoingMail = {
  recipient: string;
  subject: string;
  text: string;
  html: string;
};

@Injectable()
export class MailTransportService {
  private readonly transporter: Transporter;
  private readonly configuration: MailConfiguration;

  constructor(configuration: MailConfigurationService) {
    const config = configuration.value;
    this.configuration = config;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      ...(config.provider === 'smtp' ? { auth: { user: config.user!, pass: config.password! } } : {}),
      connectionTimeout: config.timeoutMs,
      greetingTimeout: config.timeoutMs,
      socketTimeout: config.timeoutMs,
      tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
    });
  }

  async send(message: OutgoingMail): Promise<void> {
    await this.transporter.sendMail({
      from: this.configuration.from,
      to: message.recipient,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}
