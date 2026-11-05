import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  } as unknown as ProductsService;
  const controller = new ProductsController(service);

  beforeEach(() => jest.clearAllMocks());

  it('delegates product creation to the service', () => {
    const dto = { name: 'Keyboard', price: '99.90' };
    controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('delegates stock updates without accepting a stock version', () => {
    controller.update('1fd8edce-2e8f-4ff9-a498-fc22ce193d8e', { stock: 5 });

    expect(service.update).toHaveBeenCalledWith(
      '1fd8edce-2e8f-4ff9-a498-fc22ce193d8e',
      { stock: 5 },
    );
  });
});
