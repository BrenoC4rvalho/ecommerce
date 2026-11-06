export type Product = { id: string; name: string; description: string | null; price: string; stock: number; stockVersion: number; isActive: boolean; createdAt: string; updatedAt: string };

export type ProductsPage = { data: Product[]; meta: { page: number; limit: number; total: number; totalPages: number } };
