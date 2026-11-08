import { ProductCard } from '@/features/products/components/product-card';
import type { Product } from '@/features/products/types';

type ProductGridProps = {
  products: Product[];
  onAdd?: (product: Product) => void;
  addingProductId?: string;
};

export function ProductGrid({ products, onAdd, addingProductId }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 lg:grid-cols-3 lg:gap-x-6">
      {products.map((product) => (
        <ProductCard
          isAdding={addingProductId === product.id}
          key={product.id}
          onAdd={onAdd}
          product={product}
        />
      ))}
    </div>
  );
}

export function ProductGridLoading() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          className="animate-pulse overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
          key={index}
        >
          <div className="aspect-square bg-white" />
          <div className="px-4 py-4">
            <div className="h-5 w-3/4 rounded bg-zinc-100" />
            <div className="mt-2 h-5 w-1/2 rounded bg-zinc-100" />
            <div className="mt-4 h-10 rounded-lg bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
