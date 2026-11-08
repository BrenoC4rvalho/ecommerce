import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  addCartItem,
  createCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '@/features/cart/services/cart-api';
import type { Cart } from '@/features/cart/types';
import { getFriendlyError } from '@/lib/error-messages';

export const cartQueryKey = (cartId: string) => ['cart', cartId] as const;

export function useCart() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [cartId, setCartId] = useState<string>();
  const createPromise = useRef<Promise<string> | undefined>(undefined);
  const cart = useQuery({
    queryKey: cartQueryKey(cartId ?? 'pending'),
    queryFn: () => getCart(cartId!),
    enabled: Boolean(cartId),
  });
  const create = useMutation({
    mutationFn: createCart,
  });

  const setCartData = useCallback(
    (nextCart: Cart) => {
      setCartId(nextCart.id);
      queryClient.setQueryData(cartQueryKey(nextCart.id), nextCart);
    },
    [queryClient],
  );

  const ensureCart = useCallback(async () => {
    if (cartId) return cartId;
    if (!createPromise.current) {
      createPromise.current = create
        .mutateAsync()
        .then((createdCart) => {
          setCartId(createdCart.id);
          return createdCart.id;
        })
        .finally(() => {
          createPromise.current = undefined;
        });
    }
    return createPromise.current;
  }, [cartId, create]);

  const add = useMutation({
    mutationFn: async (productId: string) => addCartItem(await ensureCart(), productId),
    onSuccess: (nextCart) => {
      setCartData(nextCart);
      toast.success('Produto adicionado ao carrinho com sucesso!');
    },
    onError: (error) => {
      toast.error(getFriendlyError(error, 'Não foi possível adicionar o produto.', 'add'));
    },
  });
  const update = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(await ensureCart(), itemId, quantity),
    onSuccess: (nextCart) => {
      setCartData(nextCart);
      toast.success('Quantidade atualizada com sucesso.');
    },
    onError: (error) => {
      toast.error(getFriendlyError(error, 'Não foi possível atualizar a quantidade.', 'update'));
    },
  });
  const remove = useMutation({
    mutationFn: async (itemId: string) => {
      const id = await ensureCart();
      await removeCartItem(id, itemId);
      return id;
    },
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey(id) });
      toast.success('Produto removido do carrinho.');
    },
    onError: (error) => {
      toast.error(getFriendlyError(error, 'Não foi possível remover o produto.', 'remove'));
    },
  });

  useEffect(() => {
    if (cart.error) {
      toast.error(getFriendlyError(cart.error, 'Não foi possível atualizar o carrinho.', 'cart'));
    }
  }, [cart.error, toast]);

  const itemCount = cart.data?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const error = add.error ?? update.error ?? remove.error ?? create.error ?? cart.error;
  const clear = () => {
    if (cartId) queryClient.removeQueries({ queryKey: cartQueryKey(cartId) });
    setCartId(undefined);
  };
  return {
    cart: cart.data,
    cartId,
    itemCount,
    ensureCart,
    add,
    update,
    remove,
    clear,
    error,
    isLoading: cart.isPending || create.isPending,
  };
}
