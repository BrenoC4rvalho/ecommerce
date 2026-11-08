'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Loading } from '@/components/ui/loading';
import { CartItem } from '@/features/cart/components/cart-item';
import { CartSummary } from '@/features/cart/components/cart-summary';
import type { Cart } from '@/features/cart/types';

type CartDrawerProps = {
  isOpen: boolean;
  cart?: Cart;
  isLoading: boolean;
  errorMessage?: string;
  pendingItemId?: string;
  title?: string;
  children?: ReactNode;
  onClose: () => void;
  onContinue: () => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onCheckout: () => void;
};

const DRAWER_TRANSITION_MS = 300;

function focusFirstElement(container: HTMLElement | null) {
  container
    ?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    )
    ?.focus();
}

export function CartDrawer({
  isOpen,
  cart,
  isLoading,
  errorMessage,
  pendingItemId,
  title = 'Meu carrinho',
  children,
  onClose,
  onContinue,
  onQuantityChange,
  onRemove,
  onCheckout,
}: CartDrawerProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;

  useEffect(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = undefined;
    }

    if (isOpen) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      let visibilityFrame: number | undefined;
      const mountFrame = window.requestAnimationFrame(() => {
        setIsMounted(true);
        visibilityFrame = window.requestAnimationFrame(() => {
          setIsVisible(true);
          focusFirstElement(panelRef.current);
        });
      });

      return () => {
        window.cancelAnimationFrame(mountFrame);
        if (visibilityFrame) window.cancelAnimationFrame(visibilityFrame);
      };
    }

    if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
      previousFocusRef.current.focus();
    }

    const visibilityFrame = window.requestAnimationFrame(() => setIsVisible(false));
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : DRAWER_TRANSITION_MS;

    closeTimeoutRef.current = setTimeout(() => {
      setIsMounted(false);
      closeTimeoutRef.current = undefined;
    }, duration);

    return () => {
      window.cancelAnimationFrame(visibilityFrame);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = undefined;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isMounted) return null;

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      inert={!isOpen}
    >
      <button
        aria-label="Fechar carrinho"
        className={`absolute inset-0 cursor-default bg-black/40 transition-opacity duration-300 ease-out motion-reduce:transition-none ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label={title}
        aria-modal="true"
        className={`absolute inset-y-0 right-0 flex w-[min(100%-1rem,440px)] flex-col bg-white p-4 shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none sm:p-6 ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {!children ? (
              <p className="mt-1 text-sm text-zinc-500">
                {itemCount} {itemCount === 1 ? 'item' : 'itens'}
              </p>
            ) : null}
          </div>
          <IconButton label="Fechar carrinho" onClick={onClose}>
            <svg
              aria-hidden="true"
              fill="none"
              height="22"
              viewBox="0 0 24 24"
              width="22"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
          </IconButton>
        </div>
        {children ?? (
          <>
            {isLoading ? <Loading label="Carregando carrinho" /> : null}
            {errorMessage ? (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{errorMessage}</p>
            ) : null}
            {cart?.items.length ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <ul className="min-h-0 flex-1 overflow-y-auto">
                  {cart.items.map((item) => (
                    <CartItem
                      isPending={pendingItemId === item.id}
                      item={item}
                      key={item.id}
                      onQuantityChange={(quantity) => onQuantityChange(item.id, quantity)}
                      onRemove={() => onRemove(item.id)}
                    />
                  ))}
                </ul>
                <CartSummary
                  disabled={Boolean(pendingItemId)}
                  onCheckout={onCheckout}
                  total={cart.estimatedTotal}
                />
              </div>
            ) : null}
            {!isLoading && !cart?.items.length ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="text-sm text-zinc-600">Seu carrinho está vazio.</p>
                <Button className="mt-4" onClick={onContinue} variant="secondary">
                  Continuar comprando
                </Button>
              </div>
            ) : null}
            {cart?.items.length ? (
              <button
                className="mt-5 text-sm text-zinc-600 underline underline-offset-4 hover:text-black"
                onClick={onContinue}
                type="button"
              >
                Continuar comprando
              </button>
            ) : null}
          </>
        )}
      </aside>
    </div>
  );
}
