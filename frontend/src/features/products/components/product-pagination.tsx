import { Button } from "@/components/ui/button";

type ProductPaginationProps = { page: number; totalPages: number; onPageChange: (page: number) => void };

export function ProductPagination({ page, totalPages, onPageChange }: ProductPaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return <nav aria-label="Paginação de produtos" className="mt-10 flex flex-wrap items-center justify-center gap-2"><Button aria-label="Página anterior" disabled={page === 1} onClick={() => onPageChange(page - 1)} variant="secondary">Anterior</Button>{pages.map((item) => <Button aria-current={item === page ? "page" : undefined} className="min-w-10 px-3" key={item} onClick={() => onPageChange(item)} variant={item === page ? "primary" : "secondary"}>{item}</Button>)}<Button aria-label="Próxima página" disabled={page === totalPages} onClick={() => onPageChange(page + 1)} variant="secondary">Próxima</Button></nav>;
}
