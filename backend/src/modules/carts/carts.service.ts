import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { sumMoney, multiplyMoney } from '../../common/money';
import { Product } from '../products/entities/product.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItem } from './entities/cart-item.entity';
import { Cart, CartStatus } from './entities/cart.entity';

@Injectable()
export class CartsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Cart) private readonly cartsRepository: Repository<Cart>,
  ) {}

  async create(sessionId?: string): Promise<Cart> {
    if (sessionId) {
      const activeCart = await this.cartsRepository.findOneBy({
        sessionId,
        status: CartStatus.ACTIVE,
      });
      if (activeCart) return activeCart;
    }

    return this.cartsRepository.save(
      this.cartsRepository.create({ sessionId: randomUUID(), status: CartStatus.ACTIVE }),
    );
  }

  async findOne(id: string, sessionId: string) {
    const cart = await this.cartsRepository.findOne({
      where: { id, sessionId },
      relations: { items: { product: true } },
      order: { items: { createdAt: 'ASC' } },
    });
    if (!cart) throw new NotFoundException('Cart not found');

    const items = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.price,
      subtotal: multiplyMoney(item.product.price, item.quantity),
    }));
    return {
      id: cart.id,
      status: cart.status,
      items,
      estimatedTotal: sumMoney(items.map((item) => item.subtotal)),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  async addItem(id: string, sessionId: string, dto: AddCartItemDto) {
    await this.dataSource.transaction(async (manager) => {
      await this.requireActiveCart(manager, id, sessionId);
      const product = await manager.findOneBy(Product, { id: dto.productId });
      if (!product) throw new NotFoundException('Product not found');

      await manager.query(
        `INSERT INTO cart_items (id, cart_id, product_id, quantity, created_at, updated_at)
         VALUES (uuid_generate_v4(), $1, $2, $3, now(), now())
         ON CONFLICT (cart_id, product_id)
         DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = now()`,
        [id, dto.productId, dto.quantity],
      );
    });
    return this.findOne(id, sessionId);
  }

  async updateItem(id: string, itemId: string, sessionId: string, dto: UpdateCartItemDto) {
    await this.dataSource.transaction(async (manager) => {
      await this.requireActiveCart(manager, id, sessionId);
      const result = await manager.update(CartItem, { id: itemId, cartId: id }, { quantity: dto.quantity });
      if (!result.affected) throw new NotFoundException('Cart item not found');
    });
    return this.findOne(id, sessionId);
  }

  async removeItem(id: string, itemId: string, sessionId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.requireActiveCart(manager, id, sessionId);
      const result = await manager.delete(CartItem, { id: itemId, cartId: id });
      if (!result.affected) throw new NotFoundException('Cart item not found');
    });
  }

  private async requireActiveCart(manager: EntityManager, id: string, sessionId: string): Promise<Cart> {
    const cart = await manager.findOne(Cart, {
      where: { id, sessionId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!cart) throw new NotFoundException('Cart not found');
    if (cart.status !== CartStatus.ACTIVE) {
      throw new ConflictException('Cart has already been checked out');
    }
    return cart;
  }
}
