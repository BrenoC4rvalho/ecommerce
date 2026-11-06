import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrderConfirmationTemplateService } from './order-confirmation-template.service';

describe('OrderConfirmationTemplateService', () => {
  it('renders escaped historical order-item data in text and HTML', () => {
    const order = {
      id: 'order-id',
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
      totalAmount: '12.50',
      status: OrderStatus.CONFIRMED,
      items: [{ productName: '<Keyboard>', quantity: 2, unitPrice: '6.25', subtotal: '12.50' }],
    } as Order;

    const rendered = new OrderConfirmationTemplateService().render(order);

    expect(rendered.subject).toContain('order-id');
    expect(rendered.text).toContain('<Keyboard>: 2 x 6.25 = 12.50');
    expect(rendered.html).toContain('&lt;Keyboard&gt;');
    expect(rendered.html).toContain('Total: 12.50');
  });
});
