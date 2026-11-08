import { ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrdersService, StockVersionConflictError } from './orders.service';

describe('OrdersService optimistic retry', () => {
  it('retries a stock-version conflict with a new transaction up to three times', async () => {
    const transaction = jest
      .fn()
      .mockRejectedValueOnce(new StockVersionConflictError())
      .mockRejectedValueOnce(new StockVersionConflictError())
      .mockResolvedValueOnce({ id: 'order-id' });
    const service = new OrdersService({ transaction } as unknown as DataSource);

    await expect(
      service.checkout('session-id', {
        cartId: '1fd8edce-2e8f-4ff9-a498-fc22ce193d8e',
        customerEmail: 'buyer@example.com',
      }),
    ).resolves.toEqual({ id: 'order-id' });
    expect(transaction).toHaveBeenCalledTimes(3);
  });

  it('returns a controlled conflict after the retry limit', async () => {
    const transaction = jest
      .fn()
      .mockRejectedValue(new StockVersionConflictError());
    const service = new OrdersService({ transaction } as unknown as DataSource);

    await expect(
      service.checkout('session-id', {
        cartId: '1fd8edce-2e8f-4ff9-a498-fc22ce193d8e',
        customerEmail: 'buyer@example.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction).toHaveBeenCalledTimes(3);
  });
});
