import { Module } from '@nestjs/common';
import { MailConfigurationService } from './mail-configuration.service';
import { MailTransportService } from './mail-transport.service';
import { OrderConfirmationTemplateService } from './order-confirmation-template.service';

@Module({
  providers: [MailConfigurationService, MailTransportService, OrderConfirmationTemplateService],
  exports: [MailConfigurationService, MailTransportService, OrderConfirmationTemplateService],
})
export class MailModule {}
