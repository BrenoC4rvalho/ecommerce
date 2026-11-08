type LoadingProps = { label?: string };

export function Loading({ label = 'Carregando' }: LoadingProps) {
  return (
    <div
      aria-live="polite"
      className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-500"
    >
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-black"
      />
      {label}
    </div>
  );
}
