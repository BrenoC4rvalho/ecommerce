import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailOutboxProcessor } from './email-outbox.processor';
import { EmailOutbox } from './entities/email-outbox.entity';
import { MailConfigurationService } from './mail-configuration.service';
import { MailTransportService } from './mail-transport.service';
import { OrderConfirmationTemplateService } from './order-confirmation-template.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmailOutbox])],
  providers: [
    MailConfigurationService,
    MailTransportService,
    OrderConfirmationTemplateService,
    EmailOutboxProcessor,
  ],
  exports: [MailConfigurationService, MailTransportService, OrderConfirmationTemplateService],
})
export class MailModule {}
