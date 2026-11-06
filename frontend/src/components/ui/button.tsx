import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary: "bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-300",
  secondary: "border border-zinc-300 bg-white text-black hover:bg-zinc-50 disabled:text-zinc-400",
  ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100 disabled:text-zinc-400",
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return <button className={`inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed ${variants[variant]} ${className}`} {...props} />;
}
