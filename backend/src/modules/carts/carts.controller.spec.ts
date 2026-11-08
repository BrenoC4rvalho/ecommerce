import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';

describe('CartsController', () => {
  const service = {
    create: jest.fn(),
    findOne: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
  } as unknown as CartsService;
  const controller = new CartsController(service);

  beforeEach(() => jest.clearAllMocks());

  it('uses the anonymous session cookie when adding an item', () => {
    const request = { cookies: { cart_session_id: 'session-id' } } as never;
    const dto = {
      productId: '1fd8edce-2e8f-4ff9-a498-fc22ce193d8e',
      quantity: 2,
    };

    controller.addItem('9d6f64e2-168b-4c04-8a04-510825d9b2cf', dto, request);

    expect(service.addItem).toHaveBeenCalledWith(
      '9d6f64e2-168b-4c04-8a04-510825d9b2cf',
      'session-id',
      dto,
    );
  });
});
