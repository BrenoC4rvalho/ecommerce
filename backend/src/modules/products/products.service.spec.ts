import { ProductsService } from './products.service';

describe('ProductsService.findAll', () => {
  it('filters the public catalog by availability and search term', async () => {
    const query = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue(query),
    } as never;
    const service = new ProductsService(repository);

    await expect(
      service.findAll({ page: 2, limit: 12, search: 'fone' }),
    ).resolves.toEqual({
      data: [],
      meta: { page: 2, limit: 12, total: 0, totalPages: 0 },
    });

    expect(query.where).toHaveBeenCalledWith('product.is_active = :isActive', {
      isActive: true,
    });
    expect(query.andWhere).toHaveBeenCalledWith(
      'product.stock > :minimumStock',
      { minimumStock: 0 },
    );
    expect(query.andWhere).toHaveBeenCalledWith(
      '(product.name ILIKE :search OR product.description ILIKE :search)',
      { search: '%fone%' },
    );
    expect(query.skip).toHaveBeenCalledWith(12);
    expect(query.take).toHaveBeenCalledWith(12);
  });
});
