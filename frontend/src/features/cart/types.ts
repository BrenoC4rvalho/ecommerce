export type CartSummary = {
  id: string;
  status: 'ACTIVE' | 'CHECKED_OUT';
  createdAt: string;
  updatedAt: string;
};
export type CartItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
};
export type Cart = CartSummary & { items: CartItem[]; estimatedTotal: string };
