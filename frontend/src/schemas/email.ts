import { z } from "zod";

export const emailSchema = z.object({
  email: z.email("Informe um e-mail válido."),
});

export type EmailFormValues = z.infer<typeof emailSchema>;
