import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { addCartItem, createCart, getCart, removeCartItem, updateCartItem } from "@/features/cart/services/cart-api";
import type { Cart } from "@/features/cart/types";

export const cartQueryKey = (cartId: string) => ["cart", cartId] as const;

export function useCart() {
  const queryClient = useQueryClient();
  const [cartId, setCartId] = useState<string>();
  const createPromise = useRef<Promise<string> | undefined>(undefined);
  const cart = useQuery({ queryKey: cartQueryKey(cartId ?? "pending"), queryFn: () => getCart(cartId!), enabled: Boolean(cartId) });
  const create = useMutation({ mutationFn: createCart });

  const setCartData = useCallback((nextCart: Cart) => {
    setCartId(nextCart.id);
    queryClient.setQueryData(cartQueryKey(nextCart.id), nextCart);
  }, [queryClient]);

  const ensureCart = useCallback(async () => {
    if (cartId) return cartId;
    if (!createPromise.current) {
      createPromise.current = create.mutateAsync().then((createdCart) => {
        setCartId(createdCart.id);
        return createdCart.id;
      }).finally(() => { createPromise.current = undefined; });
    }
    return createPromise.current;
  }, [cartId, create]);

  const add = useMutation({ mutationFn: async (productId: string) => addCartItem(await ensureCart(), productId), onSuccess: setCartData });
  const update = useMutation({ mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => updateCartItem(await ensureCart(), itemId, quantity), onSuccess: setCartData });
  const remove = useMutation({ mutationFn: async (itemId: string) => { const id = await ensureCart(); await removeCartItem(id, itemId); return id; }, onSuccess: (id) => queryClient.invalidateQueries({ queryKey: cartQueryKey(id) }) });

  const itemCount = cart.data?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const error = add.error ?? update.error ?? remove.error ?? create.error ?? cart.error;
  const clear = () => {
    if (cartId) queryClient.removeQueries({ queryKey: cartQueryKey(cartId) });
    setCartId(undefined);
  };
  return { cart: cart.data, cartId, itemCount, ensureCart, add, update, remove, clear, error, isLoading: cart.isPending || create.isPending };
}
