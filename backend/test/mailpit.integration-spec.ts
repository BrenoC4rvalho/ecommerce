import { MailConfigurationService } from '../src/modules/mail/mail-configuration.service';
import { MailTransportService } from '../src/modules/mail/mail-transport.service';

const runMailpitTest = process.env.MAILPIT_INTEGRATION === 'true';

(runMailpitTest ? describe : describe.skip)('Mailpit SMTP integration', () => {
  it('accepts a confirmation email without using a real SMTP provider', async () => {
    const transport = new MailTransportService(new MailConfigurationService());
    const recipient = `mailpit-${Date.now()}@example.test`;

    await transport.send({
      recipient,
      subject: 'Mailpit confirmation test',
      text: 'Mailpit confirmation text',
      html: '<p>Mailpit confirmation HTML</p>',
    });

    const response = await fetch('http://localhost:8025/api/v1/messages');
    expect(response.ok).toBe(true);
    const body = await response.json() as { messages?: Array<{ To?: Array<{ Address?: string }> }> };
    expect(body.messages?.some((message) => message.To?.some((address) => address.Address === recipient))).toBe(true);
  });
});
