import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-black outline-none placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black ${className}`} {...props} />;
}
