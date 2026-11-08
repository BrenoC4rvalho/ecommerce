import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { developmentProducts } from './development-products';

const DEVELOPMENT_SEED_LOCK = '928374650192';

@Injectable()
export class DevelopmentSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DevelopmentSeedService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed(process.env.NODE_ENV);
  }

  async seed(nodeEnvironment: string | undefined): Promise<void> {
    if (nodeEnvironment !== 'development') {
      this.logger.debug(
        'Development product seed skipped outside development.',
      );
      return;
    }

    const inserted = await this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1::bigint)', [
        DEVELOPMENT_SEED_LOCK,
      ]);

      if (await manager.count(Product)) return false;

      await manager.insert(
        Product,
        developmentProducts.map((product) => ({ ...product, stockVersion: 0 })),
      );
      return true;
    });

    if (inserted) {
      this.logger.log(
        `Inserted ${developmentProducts.length} development products.`,
      );
      return;
    }

    this.logger.debug(
      'Development product seed skipped because products already exist.',
    );
  }
}
