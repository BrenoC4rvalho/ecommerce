import type { Order } from '@/features/checkout/types';
import { api } from '@/lib/api';

export const checkout = (cartId: string, customerEmail: string) =>
  api.post<Order>('/api/orders/checkout', { cartId, customerEmail });
