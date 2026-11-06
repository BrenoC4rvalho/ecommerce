import { z } from "zod";

export const checkoutSchema = z.object({ customerEmail: z.email("Informe um e-mail válido.") });
export type CheckoutValues = z.infer<typeof checkoutSchema>;
