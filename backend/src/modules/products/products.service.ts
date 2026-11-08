import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll({ page = 1, limit = 20, search }: ListProductsQueryDto) {
    const query = this.productsRepository
      .createQueryBuilder('product')
      .where('product.is_active = :isActive', { isActive: true })
      .andWhere('product.stock > :minimumStock', { minimumStock: 0 });

    if (search) {
      query.andWhere('(product.name ILIKE :search OR product.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await query
      .orderBy('product.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOneBy({ id });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create({
      ...dto,
      description: dto.description ?? null,
      stock: dto.stock ?? 0,
      isActive: dto.isActive ?? true,
      stockVersion: 0,
    });
    return this.productsRepository.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    if (Object.keys(dto).length === 0) return this.findOne(id);

    const updateSet: Record<string, unknown> = { ...dto };
    if (dto.stock !== undefined) {
      updateSet.stockVersion = () =>
        'CASE WHEN "stock" IS DISTINCT FROM :stock THEN "stock_version" + 1 ELSE "stock_version" END';
    }

    const result = await this.productsRepository
      .createQueryBuilder()
      .update(Product)
      .set(updateSet)
      .where('id = :id', { id })
      .setParameters({ stock: dto.stock })
      .returning(['id'])
      .execute();

    if (!result.raw[0]) throw new NotFoundException('Product not found');
    return this.findOne(id);
  }
}
