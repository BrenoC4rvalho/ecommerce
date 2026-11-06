import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { Product } from "@/features/products/types";
import { formatCurrency } from "@/lib/formatters";

type ProductCardProps = { product: Product; isAdding?: boolean; onAdd?: (product: Product) => void };

export function ProductCard({ product, isAdding = false, onAdd }: ProductCardProps) {
  const isUnavailable = product.stock === 0;
  return <article className="min-w-0"><div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100"><Image alt={`Imagem padrão de ${product.name}`} className="object-cover" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 360px" src="/images/product-placeholder.svg" /></div><div className="pt-3"><h2 className="truncate text-sm font-medium text-black sm:text-base" title={product.name}>{product.name}</h2><p className="mt-1 text-sm text-zinc-600">{formatCurrency(product.price)}</p><Button className="mt-3 w-full" disabled={isUnavailable || isAdding || !onAdd} onClick={() => onAdd?.(product)}>{isUnavailable ? "Indisponível" : isAdding ? "Adicionando…" : "Adicionar"}</Button></div></article>;
}
