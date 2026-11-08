import { useMutation } from '@tanstack/react-query';
import { checkout } from '@/features/checkout/services/checkout-api';

export function useCheckout() {
  return useMutation({
    mutationFn: ({ cartId, customerEmail }: { cartId: string; customerEmail: string }) =>
      checkout(cartId, customerEmail),
  });
}
