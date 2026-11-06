"use client";

import { useCallback, useState } from "react";
import { Container } from "@/components/layout/container";
import { Header } from "@/components/layout/header";
import { CartDrawer } from "@/features/cart/components/cart-drawer";
import { useCart } from "@/features/cart/hooks/use-cart";
import { ProductGrid, ProductGridLoading } from "@/features/products/components/product-grid";
import { ProductPagination } from "@/features/products/components/product-pagination";
import type { Product } from "@/features/products/types";
import { useProducts } from "@/features/products/hooks/use-products";
import { ApiError } from "@/lib/api";

const PAGE_SIZE = 20;

function getFriendlyError(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback;
  if (error.status === 409) return "Estoque insuficiente. A quantidade disponível foi alterada.";
  if (error.status === 404) return "Este item não está mais disponível.";
  return error.message;
}

export default function Home() {
  const [page, setPage] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const products = useProducts(page, PAGE_SIZE);
  const cart = useCart();
  const productsError = getFriendlyError(products.error, "Não foi possível carregar os produtos.");
  const cartError = getFriendlyError(cart.error, "Não foi possível atualizar o carrinho.");
  const pendingItemId = cart.update.isPending ? cart.update.variables.itemId : cart.remove.isPending ? cart.remove.variables : undefined;

  const openCart = useCallback(() => {
    setIsCartOpen(true);
    void cart.ensureCart().catch(() => undefined);
  }, [cart]);

  const addProduct = useCallback((product: Product) => {
    cart.add.mutate(product.id, { onSuccess: () => setIsCartOpen(true) });
  }, [cart.add]);

  return <div className="min-h-screen bg-white"><Header itemCount={cart.itemCount} onOpenCart={openCart} /><main><Container><section className="py-8 sm:py-10"><div className="mb-6 flex items-center justify-between sm:mb-8"><h1 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">Produtos</h1></div>{products.isPending ? <ProductGridLoading /> : null}{products.isError ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{productsError}</p> : null}{products.data?.data.length === 0 ? <p className="rounded-lg border border-zinc-200 p-6 text-sm text-zinc-600">Nenhum produto disponível no momento.</p> : null}{products.data?.data.length ? <><ProductGrid addingProductId={cart.add.isPending ? cart.add.variables : undefined} onAdd={(product) => void addProduct(product)} products={products.data.data} /><ProductPagination onPageChange={setPage} page={products.data.meta.page} totalPages={products.data.meta.totalPages} /></> : null}</section></Container></main><CartDrawer cart={cart.cart} errorMessage={cart.error ? cartError : undefined} isLoading={cart.isLoading} isOpen={isCartOpen} onCheckout={() => undefined} onClose={() => setIsCartOpen(false)} onContinue={() => setIsCartOpen(false)} onQuantityChange={(itemId, quantity) => { if (quantity === 0) cart.remove.mutate(itemId); else cart.update.mutate({ itemId, quantity }); }} onRemove={(itemId) => cart.remove.mutate(itemId)} pendingItemId={pendingItemId} /></div>;
}
