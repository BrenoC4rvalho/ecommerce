"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Loading } from "@/components/ui/loading";
import { CartItem } from "@/features/cart/components/cart-item";
import { CartSummary } from "@/features/cart/components/cart-summary";
import type { Cart } from "@/features/cart/types";

type CartDrawerProps = { isOpen: boolean; cart?: Cart; isLoading: boolean; errorMessage?: string; pendingItemId?: string; title?: string; children?: ReactNode; onClose: () => void; onContinue: () => void; onQuantityChange: (itemId: string, quantity: number) => void; onRemove: (itemId: string) => void; onCheckout: () => void };

function focusFirstElement(container: HTMLDivElement | null) {
  container?.querySelector<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")?.focus();
}

export function CartDrawer({ isOpen, cart, isLoading, errorMessage, pendingItemId, title = "Meu carrinho", children, onClose, onContinue, onQuantityChange, onRemove, onCheckout }: CartDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  useEffect(() => { if (!isOpen) return; focusFirstElement(panelRef.current); const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; document.addEventListener("keydown", onKeyDown); return () => document.removeEventListener("keydown", onKeyDown); }, [isOpen, onClose]);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50"><button aria-label="Fechar carrinho" className="absolute inset-0 cursor-default bg-black/40" onClick={onClose} type="button" /><aside aria-label={title} aria-modal="true" className="absolute inset-y-0 right-0 flex w-[min(100%-1rem,440px)] flex-col bg-white p-4 shadow-xl sm:p-6" ref={panelRef} role="dialog" tabIndex={-1}><div className="flex items-center justify-between border-b border-zinc-200 pb-4"><div><h2 className="text-xl font-semibold">{title}</h2>{!children ? <p className="mt-1 text-sm text-zinc-500">{itemCount} {itemCount === 1 ? "item" : "itens"}</p> : null}</div><IconButton label="Fechar carrinho" onClick={onClose}><svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22" xmlns="http://www.w3.org/2000/svg"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2"/></svg></IconButton></div>{children ?? <>{isLoading ? <Loading label="Carregando carrinho" /> : null}{errorMessage ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{errorMessage}</p> : null}{cart?.items.length ? <div className="flex min-h-0 flex-1 flex-col"><ul className="min-h-0 flex-1 overflow-y-auto">{cart.items.map((item) => <CartItem isPending={pendingItemId === item.id} item={item} key={item.id} onQuantityChange={(quantity) => onQuantityChange(item.id, quantity)} onRemove={() => onRemove(item.id)} />)}</ul><CartSummary disabled={Boolean(pendingItemId)} onCheckout={onCheckout} total={cart.estimatedTotal} /></div> : null}{!isLoading && !cart?.items.length ? <div className="flex flex-1 flex-col items-center justify-center text-center"><p className="text-sm text-zinc-600">Seu carrinho está vazio.</p><Button className="mt-4" onClick={onContinue} variant="secondary">Continuar comprando</Button></div> : null}{cart?.items.length ? <button className="mt-5 text-sm text-zinc-600 underline underline-offset-4 hover:text-black" onClick={onContinue} type="button">Continuar comprando</button> : null}</>}</aside></div>;
}
