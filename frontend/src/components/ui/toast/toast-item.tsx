import { useEffect, useState } from 'react';
import type { ToastRecord } from '@/components/ui/toast/toast-provider';

type ToastItemProps = {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
};

const styles = {
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: '✓',
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-900',
    icon: '!',
  },
  info: {
    container: 'border-sky-200 bg-sky-50 text-sky-900',
    icon: 'i',
  },
} as const;

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const style = styles[toast.type];
  const isExiting = toast.status === 'exiting';

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (toast.status === 'exiting') return;

    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [onDismiss, toast.duration, toast.id, toast.status]);

  const role = toast.type === 'error' ? 'alert' : 'status';
  const live = toast.type === 'error' ? 'assertive' : 'polite';

  return (
    <div
      aria-live={live}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-lg border p-4 text-sm shadow-lg transition-all duration-200 ease-out motion-reduce:transition-none sm:w-96 ${style.container} ${isVisible && !isExiting ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
      role={role}
    >
      <span
        aria-hidden="true"
        className="flex size-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold"
      >
        {style.icon}
      </span>
      <p className="min-w-0 flex-1">{toast.message}</p>
      <button
        aria-label="Fechar notificação"
        className="shrink-0 rounded p-1 text-current/70 transition-colors hover:bg-black/5 hover:text-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        onClick={() => onDismiss(toast.id)}
        type="button"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
