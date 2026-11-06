import { Injectable } from '@nestjs/common';
import { Order } from '../orders/entities/order.entity';

type RenderedMail = { subject: string; text: string; html: string };

@Injectable()
export class OrderConfirmationTemplateService {
  render(order: Order): RenderedMail {
    const lines = order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      unitPrice: this.money(item.unitPrice),
      subtotal: this.money(item.subtotal),
    }));
    const date = order.createdAt.toISOString();
    const total = this.money(order.totalAmount);
    const textLines = lines.map((line) => `- ${line.name}: ${line.quantity} x ${line.unitPrice} = ${line.subtotal}`);
    const htmlRows = lines.map((line) => `<tr><td>${this.escape(line.name)}</td><td>${line.quantity}</td><td>${line.unitPrice}</td><td>${line.subtotal}</td></tr>`);

    return {
      subject: `Confirmação do pedido ${order.id}`,
      text: [`Pedido confirmado: ${order.id}`, `Data: ${date}`, '', ...textLines, '', `Total: ${total}`, '', 'Obrigado pela sua compra.'].join('\n'),
      html: `<html><body><h1>Pedido confirmado</h1><p>Pedido: ${this.escape(order.id)}</p><p>Data: ${this.escape(date)}</p><table><thead><tr><th>Produto</th><th>Quantidade</th><th>Preço unitário</th><th>Subtotal</th></tr></thead><tbody>${htmlRows.join('')}</tbody></table><p><strong>Total: ${this.escape(total)}</strong></p><p>Obrigado pela sua compra.</p></body></html>`,
    };
  }

  private money(value: string): string {
    return Number(value).toFixed(2);
  }

  private escape(value: string): string {
    return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
  }
}
