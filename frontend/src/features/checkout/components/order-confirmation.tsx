import { Button } from "@/components/ui/button";
import type { Order } from "@/features/checkout/types";
import { formatCurrency } from "@/lib/formatters";

export function OrderConfirmation({ order, onClose }: { order: Order; onClose: () => void }) {
  return <div className="flex flex-1 flex-col justify-center text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-full bg-zinc-100"><svg aria-hidden="true" fill="none" height="25" viewBox="0 0 24 24" width="25" xmlns="http://www.w3.org/2000/svg"><path d="m5 12 4 4L19 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg></div><h3 className="mt-5 text-xl font-semibold">Compra confirmada</h3><p className="mt-2 text-sm text-zinc-600">Pedido <span className="font-medium text-black">#{order.id.slice(0, 8)}</span></p><p className="mt-1 text-sm text-zinc-600">Total: <span className="font-medium text-black">{formatCurrency(order.totalAmount)}</span></p><Button className="mt-8 w-full" onClick={onClose}>Continuar comprando</Button></div>;
}
