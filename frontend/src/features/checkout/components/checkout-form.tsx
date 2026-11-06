"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkoutSchema, type CheckoutValues } from "@/features/checkout/schemas/checkout.schema";

type CheckoutFormProps = { isSubmitting: boolean; errorMessage?: string; onBack: () => void; onSubmit: (values: CheckoutValues) => void };

export function CheckoutForm({ isSubmitting, errorMessage, onBack, onSubmit }: CheckoutFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutValues>({ resolver: zodResolver(checkoutSchema), defaultValues: { customerEmail: "" } });
  return <form className="flex flex-1 flex-col" noValidate onSubmit={handleSubmit(onSubmit)}><div className="flex-1 pt-6"><p className="text-sm text-zinc-600">Informe seu e-mail para confirmar o pedido.</p><label className="mt-6 block text-sm font-medium" htmlFor="customer-email">E-mail</label><Input aria-describedby={errors.customerEmail ? "customer-email-error" : undefined} aria-invalid={Boolean(errors.customerEmail)} className="mt-2" id="customer-email" placeholder="voce@exemplo.com" type="email" {...register("customerEmail")} />{errors.customerEmail ? <p className="mt-2 text-sm text-red-700" id="customer-email-error">{errors.customerEmail.message}</p> : null}{errorMessage ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{errorMessage}</p> : null}</div><div className="space-y-3 border-t border-zinc-200 pt-4"><Button className="w-full" disabled={isSubmitting} type="submit">{isSubmitting ? "Finalizando…" : "Confirmar compra"}</Button><Button className="w-full" disabled={isSubmitting} onClick={onBack} type="button" variant="secondary">Voltar ao carrinho</Button></div></form>;
}
