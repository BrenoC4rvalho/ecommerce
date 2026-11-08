import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { sumMoney, multiplyMoney } from '../../common/money';
import { CartItem } from '../carts/entities/cart-item.entity';
import { Cart, CartStatus } from '../carts/entities/cart.entity';
import { isCartExpired } from '../carts/cart-expiration';
import { Product } from '../products/entities/product.entity';
import { CheckoutDto } from './dto/checkout.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { EmailEventType, EmailOutbox, EmailOutboxStatus } from '../mail/entities/email-outbox.entity';

export class StockVersionConflictError extends Error {}

@Injectable()
export class OrdersService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async checkout(sessionId: string, dto: CheckoutDto): Promise<Order> {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.dataSource.transaction((manager) =>
          this.checkoutOnce(manager, sessionId, dto),
        );
      } catch (error) {
        if (!(error instanceof StockVersionConflictError)) throw error;
        if (attempt === 3) throw new ConflictException('Stock changed during checkout');
      }
    }

    throw new ConflictException('Stock changed during checkout');
  }

  private async checkoutOnce(
    manager: EntityManager,
    sessionId: string,
    dto: CheckoutDto,
  ): Promise<Order> {
    const cart = await manager.findOne(Cart, {
      where: { id: dto.cartId, sessionId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!cart) throw new NotFoundException('Cart not found');
    if (cart.status !== CartStatus.ACTIVE) {
      throw new ConflictException('Cart has already been checked out');
    }
    if (isCartExpired(cart.updatedAt)) throw new NotFoundException('Cart not found');

    const items = await manager.find(CartItem, { where: { cartId: cart.id } });
    if (items.length === 0) throw new UnprocessableEntityException('Cart is empty');

    const productIds = [...new Set(items.map((item) => item.productId))].sort();
    const products = await manager.findBy(Product, productIds.map((id) => ({ id })));
    const productsById = new Map(products.map((product) => [product.id, product]));
    const lines = items.map((item) => {
      const product = productsById.get(item.productId);
      if (!product) throw new NotFoundException('Product not found');
      if (!product.isActive) throw new UnprocessableEntityException('Product is inactive');
      return { item, product, subtotal: multiplyMoney(product.price, item.quantity) };
    });

    for (const productId of productIds) {
      const line = lines.find(({ product }) => product.id === productId)!;
      const result = await manager.query(
        `UPDATE products
         SET stock = stock - $1, stock_version = stock_version + 1
         WHERE id = $2 AND stock_version = $3 AND stock >= $1 AND is_active = true
         RETURNING id, stock, stock_version`,
        [line.item.quantity, line.product.id, line.product.stockVersion],
      );
      const updatedRows = Array.isArray(result[0]) ? result[0] : result;
      if (updatedRows.length === 0) {
        await this.throwStockFailure(manager, line.product.id, line.item.quantity);
      }
    }

    const totalAmount = sumMoney(lines.map((line) => line.subtotal));
    const order = await manager.save(
      manager.create(Order, {
        cartId: cart.id,
        customerEmail: dto.customerEmail,
        status: OrderStatus.CONFIRMED,
        totalAmount,
      }),
    );

    await manager.insert(
      OrderItem,
      lines.map(({ item, product }) => ({
        orderId: order.id,
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
      })),
    );
    await manager.update(Cart, cart.id, { status: CartStatus.CHECKED_OUT });
    await manager.save(
      manager.create(EmailOutbox, {
        orderId: order.id,
        recipient: dto.customerEmail,
        eventType: EmailEventType.ORDER_CONFIRMATION,
        status: EmailOutboxStatus.PENDING,
        attempts: 0,
        nextAttemptAt: new Date(),
      }),
    );

    return manager.findOneOrFail(Order, { where: { id: order.id }, relations: { items: true } });
  }

  private async throwStockFailure(manager: EntityManager, productId: string, quantity: number): Promise<never> {
    const product = await manager.findOneBy(Product, { id: productId });
    if (!product) throw new NotFoundException('Product not found');
    if (!product.isActive) throw new UnprocessableEntityException('Product is inactive');
    if (product.stock < quantity) throw new ConflictException('Insufficient stock');
    throw new StockVersionConflictError('Stock version conflict');
  }
}
