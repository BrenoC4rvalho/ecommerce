import { Injectable } from '@nestjs/common';
import { Order } from '../orders/entities/order.entity';

type RenderedMail = { subject: string; text: string; html: string };

@Injectable()
export class OrderConfirmationTemplateService {
  render(order: Order): RenderedMail {
    const date = this.formatDate(order.createdAt);
    const total = this.formatMoney(order.totalAmount);
    const lines = order.items.map((item) => ({ name: item.productName, quantity: item.quantity, unitPrice: this.formatMoney(item.unitPrice), subtotal: this.formatMoney(item.subtotal) }));
    const rows = lines.map((line) => `<tr><td style="padding:12px;border-bottom:1px solid #e4e4e7">${this.escape(line.name)}</td><td align="center" style="padding:12px;border-bottom:1px solid #e4e4e7">${line.quantity}</td><td align="right" style="padding:12px;border-bottom:1px solid #e4e4e7">${line.unitPrice}</td><td align="right" style="padding:12px;border-bottom:1px solid #e4e4e7">${line.subtotal}</td></tr>`).join('');
    return {
      subject: `Confirmação do pedido ${order.orderNumber}`,
      text: ['Compra confirmada!', 'Seu pedido foi recebido e registrado com sucesso.', '', `Número do pedido: ${order.orderNumber}`, `Data e horário: ${date}`, '', 'Produtos:', ...lines.map((line) => `- ${line.name}: ${line.quantity} x ${line.unitPrice} = ${line.subtotal}`), '', `Total: ${total}`, '', 'Obrigado por comprar conosco!', 'Este é um e-mail automático. Por favor, não responda.'].join('\n'),
      html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #e4e4e7"><tr><td style="padding:22px 28px;background:#000;color:#fff;font-size:22px;font-weight:bold">ecommerce</td></tr><tr><td style="padding:32px 28px"><h1 style="margin:0 0 8px;font-size:24px">Compra confirmada!</h1><p style="margin:0 0 24px;color:#52525b">Seu pedido foi recebido e registrado com sucesso.</p><p style="padding:16px;background:#fafafa;border:1px solid #e4e4e7"><strong>Número do pedido:</strong> ${this.escape(order.orderNumber)}<br><span style="color:#52525b">Data e horário: ${this.escape(date)}</span></p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px"><thead><tr style="background:#18181b;color:#fff"><th align="left" style="padding:12px">Produto</th><th style="padding:12px">Quantidade</th><th align="right" style="padding:12px">Preço unitário</th><th align="right" style="padding:12px">Subtotal</th></tr></thead><tbody>${rows}</tbody></table><p style="text-align:right;font-size:18px;font-weight:bold">Total: ${this.escape(total)}</p><p style="color:#52525b">Obrigado por comprar conosco!</p></td></tr><tr><td style="padding:20px 28px;border-top:1px solid #e4e4e7;color:#71717a;font-size:12px">Este é um e-mail automático. Por favor, não responda.</td></tr></table></td></tr></table></body></html>`,
    };
  }

  private formatDate(value: Date): string { return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'long', timeStyle: 'short' }).format(value); }
  private formatMoney(value: string): string { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)); }
  private escape(value: string): string { return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!); }
}
