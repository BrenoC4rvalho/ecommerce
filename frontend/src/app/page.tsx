import { ApiStatus } from "@/components/ui/api-status";
import { EmailFormExample } from "@/components/ui/email-form-example";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-indigo-600">Setup inicial</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">E-commerce</h1>
        <p className="mt-4 text-slate-600">Frontend Next.js funcionando.</p>
        <ApiStatus />
        <EmailFormExample />
      </section>
    </main>
  );
}
