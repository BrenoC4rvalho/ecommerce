"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { emailSchema, type EmailFormValues } from "@/schemas/email";

export function EmailFormExample() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  return (
    <form
      className="mt-8 max-w-md space-y-3 rounded-xl border border-slate-200 p-5"
      noValidate
      onSubmit={handleSubmit(() => undefined)}
    >
      <div>
        <label className="block text-sm font-medium" htmlFor="email">
          E-mail de demonstração
        </label>
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          id="email"
          type="email"
          aria-describedby={errors.email ? "email-error" : undefined}
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? <p className="mt-1 text-sm text-red-600" id="email-error">{errors.email.message}</p> : null}
      </div>
      <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white" type="submit">
        Validar e-mail
      </button>
      {isSubmitSuccessful ? <p className="text-sm text-emerald-700">E-mail válido.</p> : null}
    </form>
  );
}
