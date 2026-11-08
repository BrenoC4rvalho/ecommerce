import { useMutation } from '@tanstack/react-query';
import { checkout } from '@/features/checkout/services/checkout-api';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-messages';

export function useCheckout() {
  const toast = useToast();

  return useMutation({
    mutationFn: ({ cartId, customerEmail }: { cartId: string; customerEmail: string }) =>
      checkout(cartId, customerEmail),
    onError: (error) => {
      toast.error(getFriendlyError(error, 'Não foi possível finalizar a compra.', 'checkout'));
    },
  });
}
