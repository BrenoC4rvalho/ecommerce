export function ProductGridLoading() {
  return <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 lg:grid-cols-3 lg:gap-x-6">{Array.from({ length: 6 }, (_, index) => <div className="animate-pulse" key={index}><div className="aspect-square rounded-xl bg-zinc-100" /><div className="mt-3 h-4 w-3/4 rounded bg-zinc-100" /><div className="mt-2 h-4 w-1/3 rounded bg-zinc-100" /><div className="mt-3 h-10 rounded-lg bg-zinc-100" /></div>)}</div>;
}
