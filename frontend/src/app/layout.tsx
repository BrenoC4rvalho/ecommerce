import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppProviders } from '@/providers/app-providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'E-commerce',
  description: 'Frontend do E-commerce',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
