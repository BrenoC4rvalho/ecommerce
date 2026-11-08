import { Order, OrderStatus } from '../orders/entities/order.entity';
import { OrderConfirmationTemplateService } from './order-confirmation-template.service';

describe('OrderConfirmationTemplateService', () => {
  it('renders escaped historical order-item data in text and HTML', () => {
    const order = {
      id: 'order-id',
      createdAt: new Date('2026-11-08T02:44:03.833Z'),
      totalAmount: '12.50',
      status: OrderStatus.CONFIRMED,
      items: [{ productName: '<Keyboard>', quantity: 2, unitPrice: '6.25', subtotal: '12.50' }],
    } as Order;

    const rendered = new OrderConfirmationTemplateService().render(order);

    expect(rendered.subject).toContain('order-id');
    expect(rendered.text).toContain('<Keyboard>: 2 x R$');
    expect(rendered.text).toContain('7 de novembro de 2026 às 23:44');
    expect(rendered.html).toContain('&lt;Keyboard&gt;');
    expect(rendered.html).toContain('Compra confirmada!');
    expect(rendered.html).toContain('Preço unitário');
    expect(rendered.html).toContain('R$');
  });
});
