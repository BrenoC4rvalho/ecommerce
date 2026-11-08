import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { Product } from '@/features/products/types';
import { formatCurrency } from '@/lib/formatters';
import { getProductImage } from '@/lib/product-image';

type ProductCardProps = {
  product: Product;
  isAdding?: boolean;
  onAdd?: (product: Product) => void;
};

export function ProductCard({ product, isAdding = false, onAdd }: ProductCardProps) {
  const isUnavailable = product.stock === 0;
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md">
      <div className="relative aspect-square overflow-hidden pt-4">
        <Image
          alt={`Imagem de ${product.name}`}
          className="!inset-x-0 !top-4 !h-[calc(100%-1rem)] !w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 360px"
          src={getProductImage(product.id)}
        />
      </div>
      <div className="flex flex-1 flex-col px-4 py-4">
        <h2
          className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-black sm:text-base"
          title={product.name}
        >
          {product.name}
        </h2>
        <p className="mt-2 text-base font-semibold tabular-nums text-black">
          {formatCurrency(product.price)}
        </p>
        <Button
          className="mt-4 w-full"
          disabled={isUnavailable || isAdding || !onAdd}
          onClick={() => onAdd?.(product)}
        >
          {isUnavailable ? 'Indisponível' : isAdding ? 'Adicionando…' : 'Adicionar'}
        </Button>
      </div>
    </article>
  );
}
