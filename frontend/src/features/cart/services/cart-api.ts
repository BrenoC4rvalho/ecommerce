import type { Cart, CartSummary } from "@/features/cart/types";
import { api } from "@/lib/api";

export const createCart = () => api.post<CartSummary>("/api/carts");
export const getCart = (cartId: string) => api.get<Cart>(`/api/carts/${cartId}`);
export const addCartItem = (cartId: string, productId: string, quantity = 1) => api.post<Cart>(`/api/carts/${cartId}/items`, { productId, quantity });
export const updateCartItem = (cartId: string, itemId: string, quantity: number) => api.patch<Cart>(`/api/carts/${cartId}/items/${itemId}`, { quantity });
export const removeCartItem = (cartId: string, itemId: string) => api.delete<void>(`/api/carts/${cartId}/items/${itemId}`);
