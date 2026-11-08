'use client';

import { Container } from '@/components/layout/container';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

type HeaderProps = {
  itemCount: number;
  onOpenCart: () => void;
  search: string;
  onSearchChange: (value: string) => void;
};

export function Header({ itemCount, onOpenCart, search, onSearchChange }: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <Container>
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 md:grid-cols-[auto_minmax(280px,480px)_auto] md:gap-8 md:py-4">
          <Link className="text-xl font-semibold tracking-tight text-black" href="/">
            ecommerce
          </Link>
          <div className="order-3 col-span-2 md:order-none md:col-span-1">
            <label className="relative block">
              <span className="sr-only">Buscar produtos</span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500"
              >
                <svg
                  fill="none"
                  height="18"
                  viewBox="0 0 24 24"
                  width="18"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </span>
              <Input
                className="pl-10"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar produtos"
                type="search"
                value={search}
              />
            </label>
          </div>
          <div className="justify-self-end">
            <IconButton className="relative" label="Abrir carrinho" onClick={onOpenCart}>
              <svg
                aria-hidden="true"
                fill="none"
                height="22"
                viewBox="0 0 24 24"
                width="22"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 4h2l1.6 10.1a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 1.9-1.5L20 7H6.2M9 20.2h.01M17 20.2h.01"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
              {itemCount > 0 ? (
                <span className="absolute right-0 top-0 flex size-4 translate-x-0.5 -translate-y-0.5 items-center justify-center rounded-full bg-black text-[10px] font-semibold text-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              ) : null}
            </IconButton>
          </div>
        </div>
      </Container>
    </header>
  );
}
