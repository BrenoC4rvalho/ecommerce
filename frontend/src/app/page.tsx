"use client";

import { useState } from "react";
import { Container } from "@/components/layout/container";
import { Header } from "@/components/layout/header";
import { ProductGrid, ProductGridLoading } from "@/features/products/components/product-grid";
import { ProductPagination } from "@/features/products/components/product-pagination";
import { useProducts } from "@/features/products/hooks/use-products";
import { ApiError } from "@/lib/api";

const PAGE_SIZE = 20;

export default function Home() {
  const [page, setPage] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const products = useProducts(page, PAGE_SIZE);
  const errorMessage = products.error instanceof ApiError ? products.error.message : "Não foi possível carregar os produtos.";

  return <div className="min-h-screen bg-white"><Header itemCount={0} onOpenCart={() => setIsCartOpen(true)} /><main><Container><section className="py-8 sm:py-10"><div className="mb-6 flex items-center justify-between sm:mb-8"><h1 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">Produtos</h1></div>{products.isPending ? <ProductGridLoading /> : null}{products.isError ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{errorMessage}</p> : null}{products.data?.data.length === 0 ? <p className="rounded-lg border border-zinc-200 p-6 text-sm text-zinc-600">Nenhum produto disponível no momento.</p> : null}{products.data?.data.length ? <><ProductGrid products={products.data.data} /><ProductPagination onPageChange={setPage} page={products.data.meta.page} totalPages={products.data.meta.totalPages} /></> : null}</section></Container></main>{isCartOpen ? <div aria-hidden="true" className="fixed inset-0 bg-black/40" onClick={() => setIsCartOpen(false)} /> : null}</div>;
}
