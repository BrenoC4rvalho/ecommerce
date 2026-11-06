"use client";

import { useState } from "react";
import { Container } from "@/components/layout/container";
import { Header } from "@/components/layout/header";
import { ProductGridLoading } from "@/features/products/components/product-grid";

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return <div className="min-h-screen bg-white"><Header itemCount={0} onOpenCart={() => setIsCartOpen(true)} /><main><Container><section className="py-8 sm:py-10"><div className="mb-6 flex items-center justify-between sm:mb-8"><h1 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">Produtos</h1></div><ProductGridLoading /></section></Container></main>{isCartOpen ? <div aria-hidden="true" className="fixed inset-0 bg-black/40" onClick={() => setIsCartOpen(false)} /> : null}</div>;
}
