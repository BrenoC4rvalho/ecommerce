import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  it('passes the session cookie and checkout body to the service', () => {
    const service = { checkout: jest.fn() } as unknown as OrdersService;
    const controller = new OrdersController(service);
    const dto = { cartId: '1fd8edce-2e8f-4ff9-a498-fc22ce193d8e', customerEmail: 'buyer@example.com' };

    controller.checkout(dto, { cookies: { cart_session_id: 'session-id' } } as never);

    expect(service.checkout).toHaveBeenCalledWith('session-id', dto);
  });
});
