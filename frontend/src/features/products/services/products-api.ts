import type { ProductsPage } from '@/features/products/types';
import { api } from '@/lib/api';

type GetProductsOptions = { page: number; limit?: number; search?: string; signal?: AbortSignal };

export function getProducts({ page, limit = 20, search, signal }: GetProductsOptions) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) params.set('search', search);
  return api.get<ProductsPage>(`/api/products?${params.toString()}`, { signal });
}
