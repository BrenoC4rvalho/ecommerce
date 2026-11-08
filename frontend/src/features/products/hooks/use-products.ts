import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/features/products/services/products-api';

export const productsQueryKey = (page: number, limit: number, search = '') =>
  ['products', { page, limit, search }] as const;

export function useProducts(page: number, limit = 20, search = '') {
  return useQuery({
    queryKey: productsQueryKey(page, limit, search),
    queryFn: ({ signal }) => getProducts({ page, limit, search, signal }),
  });
}
