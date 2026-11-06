import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";

type CartSummaryProps = { total: string; disabled: boolean; onCheckout: () => void };

export function CartSummary({ total, disabled, onCheckout }: CartSummaryProps) {
  return <div className="border-t border-zinc-200 pt-4"><div className="flex items-center justify-between text-base font-semibold"><span>Subtotal</span><span>{formatCurrency(total)}</span></div><Button className="mt-4 w-full" disabled={disabled} onClick={onCheckout}>Finalizar compra</Button></div>;
}
