import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/features/products/services/products-api";

export const productsQueryKey = (page: number, limit: number) => ["products", { page, limit }] as const;

export function useProducts(page: number, limit = 20) {
  return useQuery({ queryKey: productsQueryKey(page, limit), queryFn: () => getProducts(page, limit) });
}
