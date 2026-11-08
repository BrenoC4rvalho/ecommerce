'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast/toast-provider';
import { QueryProvider } from '@/providers/query-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <QueryProvider>{children}</QueryProvider>
    </ToastProvider>
  );
}
