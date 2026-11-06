import type { ProductsPage } from "@/features/products/types";
import { api } from "@/lib/api";

export function getProducts(page: number, limit = 20) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), isActive: "true" });
  return api.get<ProductsPage>(`/api/products?${params.toString()}`);
}
