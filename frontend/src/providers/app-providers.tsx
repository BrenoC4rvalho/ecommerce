'use client';

import type { ReactNode } from 'react';
import { CookieNotice } from '@/components/ui/cookie-notice';
import { ToastProvider } from '@/components/ui/toast/toast-provider';
import { QueryProvider } from '@/providers/query-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <QueryProvider>{children}</QueryProvider>
      <CookieNotice />
    </ToastProvider>
  );
}
