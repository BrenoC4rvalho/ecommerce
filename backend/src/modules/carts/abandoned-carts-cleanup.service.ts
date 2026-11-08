import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartStatus } from './entities/cart.entity';

@Injectable()
export class AbandonedCartsCleanupService {
  private readonly logger = new Logger(AbandonedCartsCleanupService.name);

  constructor(
    @InjectRepository(Cart) private readonly cartsRepository: Repository<Cart>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
  async cleanExpiredCarts(): Promise<number> {
    const result = await this.cartsRepository
      .createQueryBuilder()
      .delete()
      .from(Cart)
      .where('status = :status', { status: CartStatus.ACTIVE })
      .andWhere("updated_at < CURRENT_TIMESTAMP - INTERVAL '7 days'")
      .execute();
    const removed = result.affected ?? 0;
    this.logger.log(`Removed ${removed} abandoned carts`);
    return removed;
  }
}
