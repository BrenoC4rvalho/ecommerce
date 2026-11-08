'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Container } from '@/components/layout/container';
import { Header } from '@/components/layout/header';
import { CartDrawer } from '@/features/cart/components/cart-drawer';
import { useCart } from '@/features/cart/hooks/use-cart';
import { CheckoutForm } from '@/features/checkout/components/checkout-form';
import { OrderConfirmation } from '@/features/checkout/components/order-confirmation';
import { useCheckout } from '@/features/checkout/hooks/use-checkout';
import type { CheckoutValues } from '@/features/checkout/schemas/checkout.schema';
import type { Order } from '@/features/checkout/types';
import { ProductGrid, ProductGridLoading } from '@/features/products/components/product-grid';
import { ProductPagination } from '@/features/products/components/product-pagination';
import { useProducts } from '@/features/products/hooks/use-products';
import type { Product } from '@/features/products/types';
import { ApiError } from '@/lib/api';

const PAGE_SIZE = 20;
type DrawerMode = 'cart' | 'checkout' | 'confirmation';

function getFriendlyError(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback;
  if (error.status === 409) return 'Estoque insuficiente. A quantidade disponível foi alterada.';
  if (error.status === 422) return 'Seu carrinho está vazio ou possui um produto indisponível.';
  if (error.status === 404) return 'Este recurso não está mais disponível.';
  return error.message;
}

export default function Home() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('cart');
  const [confirmation, setConfirmation] = useState<Order>();
  const [feedback, setFeedback] = useState<string>();
  const products = useProducts(page, PAGE_SIZE);
  const cart = useCart();
  const checkout = useCheckout();
  const productsError = getFriendlyError(products.error, 'Não foi possível carregar os produtos.');
  const cartError = getFriendlyError(cart.error, 'Não foi possível atualizar o carrinho.');
  const checkoutError = getFriendlyError(checkout.error, 'Não foi possível finalizar a compra.');
  const pendingItemId = cart.update.isPending
    ? cart.update.variables.itemId
    : cart.remove.isPending
      ? cart.remove.variables
      : undefined;

  const closeDrawer = useCallback(() => {
    setIsCartOpen(false);
    setDrawerMode('cart');
  }, []);
  const openCart = useCallback(() => {
    setDrawerMode('cart');
    setIsCartOpen(true);
    void cart.ensureCart().catch(() => undefined);
  }, [cart]);
  const addProduct = useCallback(
    (product: Product) => {
      cart.add.mutate(product.id, {
        onSuccess: () => {
          setFeedback('Produto adicionado ao carrinho.');
          setIsCartOpen(true);
        },
      });
    },
    [cart.add],
  );
  const submitCheckout = useCallback(
    (values: CheckoutValues) => {
      if (!cart.cartId) return;
      checkout.mutate(
        { cartId: cart.cartId, customerEmail: values.customerEmail },
        {
          onSuccess: (order) => {
            cart.clear();
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setConfirmation(order);
            setDrawerMode('confirmation');
          },
        },
      );
    },
    [cart, checkout, queryClient],
  );

  const drawerContent =
    drawerMode === 'checkout' ? (
      <CheckoutForm
        errorMessage={checkout.error ? checkoutError : undefined}
        isSubmitting={checkout.isPending}
        onBack={() => setDrawerMode('cart')}
        onSubmit={submitCheckout}
      />
    ) : drawerMode === 'confirmation' && confirmation ? (
      <OrderConfirmation onClose={closeDrawer} order={confirmation} />
    ) : undefined;
  const drawerTitle =
    drawerMode === 'checkout'
      ? 'Finalizar compra'
      : drawerMode === 'confirmation'
        ? 'Pedido confirmado'
        : 'Meu carrinho';

  return (
    <div className="min-h-screen bg-white">
      <Header itemCount={cart.itemCount} onOpenCart={openCart} />
      <main>
        <Container>
          <section className="py-8 sm:py-10">
            <div className="mb-6 flex items-center justify-between sm:mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">
                Produtos
              </h1>
            </div>
            {feedback ? (
              <p
                aria-live="polite"
                className="mb-5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700"
              >
                {feedback}
              </p>
            ) : null}
            {products.isPending ? <ProductGridLoading /> : null}
            {products.isError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {productsError}
              </p>
            ) : null}
            {products.data?.data.length === 0 ? (
              <p className="rounded-lg border border-zinc-200 p-6 text-sm text-zinc-600">
                Nenhum produto disponível no momento.
              </p>
            ) : null}
            {products.data?.data.length ? (
              <>
                <ProductGrid
                  addingProductId={cart.add.isPending ? cart.add.variables : undefined}
                  onAdd={addProduct}
                  products={products.data.data}
                />
                <ProductPagination
                  onPageChange={setPage}
                  page={products.data.meta.page}
                  totalPages={products.data.meta.totalPages}
                />
              </>
            ) : null}
          </section>
        </Container>
      </main>
      <CartDrawer
        cart={cart.cart}
        errorMessage={cart.error ? cartError : undefined}
        isLoading={cart.isLoading}
        isOpen={isCartOpen}
        onCheckout={() => setDrawerMode('checkout')}
        onClose={closeDrawer}
        onContinue={closeDrawer}
        onQuantityChange={(itemId, quantity) => {
          if (quantity === 0) cart.remove.mutate(itemId);
          else cart.update.mutate({ itemId, quantity });
        }}
        onRemove={(itemId) => cart.remove.mutate(itemId)}
        pendingItemId={pendingItemId}
        title={drawerTitle}
      >
        {drawerContent}
      </CartDrawer>
    </div>
  );
}
