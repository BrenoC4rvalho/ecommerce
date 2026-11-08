'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ToastContainer } from '@/components/ui/toast/toast-container';

export type ToastType = 'success' | 'error' | 'info';
export type ToastDuration = number | undefined;

export type ToastOptions = {
  duration?: ToastDuration;
};

export type ToastRecord = {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  status: 'entering' | 'visible' | 'exiting';
};

type ToastContextValue = {
  showToast: (type: ToastType, message: string, options?: ToastOptions) => string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  info: 3000,
};
const EXIT_DURATION = 200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(0);
  const exitTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = exitTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      exitTimers.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      setToasts((current) =>
        current.map((toast) => {
          if (toast.id !== id || toast.status === 'exiting') return toast;
          return { ...toast, status: 'exiting' };
        }),
      );

      if (!exitTimers.current.has(id)) {
        exitTimers.current.set(
          id,
          setTimeout(() => remove(id), EXIT_DURATION),
        );
      }
    },
    [remove],
  );

  const showToast = useCallback((type: ToastType, message: string, options?: ToastOptions) => {
    const id = `toast-${nextId.current++}`;
    const duration = options?.duration ?? DEFAULT_DURATIONS[type];

    setToasts((current) => {
      const existing = current.find(
        (toast) => toast.type === type && toast.message === message && toast.status !== 'exiting',
      );
      if (existing) return current;

      return [...current, { id, type, message, duration, status: 'entering' }];
    });

    return id;
  }, []);

  useEffect(() => {
    const timers = exitTimers.current;

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const success = useCallback(
    (message: string, options?: ToastOptions) => showToast('success', message, options),
    [showToast],
  );
  const error = useCallback(
    (message: string, options?: ToastOptions) => showToast('error', message, options),
    [showToast],
  );
  const info = useCallback(
    (message: string, options?: ToastOptions) => showToast('info', message, options),
    [showToast],
  );

  const value = useMemo(
    () => ({ showToast, success, error, info, dismiss }),
    [showToast, success, error, info, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
