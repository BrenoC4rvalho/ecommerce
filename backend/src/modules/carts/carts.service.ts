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
      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
        lock: { mode: 'pessimistic_read' },
      });
      if (!product) throw new NotFoundException('Product not found');

      const item = await manager.findOne(CartItem, {
        where: { cartId: id, productId: dto.productId },
      });
      const requestedQuantity = (item?.quantity ?? 0) + dto.quantity;
      this.ensureQuantityWithinStock(product, requestedQuantity);

      if (item) {
        item.quantity = requestedQuantity;
        await manager.save(item);
        return;
      }

      await manager.save(manager.create(CartItem, {
        cartId: id,
        productId: dto.productId,
        quantity: dto.quantity,
      }));
    });
    return this.findOne(id, sessionId);
  }

  async updateItem(id: string, itemId: string, sessionId: string, dto: UpdateCartItemDto) {
    await this.dataSource.transaction(async (manager) => {
      await this.requireActiveCart(manager, id, sessionId);
      const item = await manager.findOne(CartItem, { where: { id: itemId, cartId: id } });
      if (!item) throw new NotFoundException('Cart item not found');

      const product = await manager.findOne(Product, {
        where: { id: item.productId },
        lock: { mode: 'pessimistic_read' },
      });
      if (!product) throw new NotFoundException('Product not found');

      this.ensureQuantityWithinStock(product, dto.quantity);
      item.quantity = dto.quantity;
      await manager.save(item);
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

  private ensureQuantityWithinStock(product: Product, requestedQuantity: number): void {
    if (requestedQuantity <= product.stock) return;

    throw new ConflictException({
      message: 'Quantidade solicitada excede o estoque disponível',
      details: {
        productId: product.id,
        requestedQuantity,
        availableQuantity: product.stock,
      },
    });
  }
}
