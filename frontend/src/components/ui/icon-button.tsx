import type { ButtonHTMLAttributes } from 'react';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { label: string };

export function IconButton({ className = '', label, children, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`inline-flex size-11 items-center justify-center rounded-lg text-black transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:text-zinc-400 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
