'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const COOKIE_NOTICE_STORAGE_KEY = 'ecommerce-cookie-notice-acknowledged';

const EXIT_DURATION_MS = 220;

type CookieNoticeProps = {
  privacyPolicyHref?: string;
  storageKey?: string;
};

export function CookieNotice({
  privacyPolicyHref = '/politica-de-privacidade',
  storageKey = COOKIE_NOTICE_STORAGE_KEY,
}: CookieNoticeProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let isAcknowledged = false;

    try {
      isAcknowledged = window.localStorage.getItem(storageKey) === 'true';
    } catch {
      isAcknowledged = false;
    }

    if (isAcknowledged) return;

    let visibilityFrame: number | undefined;
    const mountFrame = window.requestAnimationFrame(() => {
      setIsMounted(true);
      visibilityFrame = window.requestAnimationFrame(() => setIsVisible(true));
    });

    return () => {
      window.cancelAnimationFrame(mountFrame);
      if (visibilityFrame) window.cancelAnimationFrame(visibilityFrame);
    };
  }, [storageKey]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const acknowledge = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, 'true');
    } catch {
      // A blocked storage API must not prevent the user from dismissing the notice.
    }

    setIsVisible(false);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);

    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : EXIT_DURATION_MS;
    closeTimeoutRef.current = setTimeout(() => {
      setIsMounted(false);
      closeTimeoutRef.current = undefined;
    }, duration);
  }, [storageKey]);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-4 sm:max-w-lg sm:p-0 sm:pb-4">
      <aside
        aria-label="Aviso sobre cookies"
        className={`rounded-xl border border-zinc-300 bg-white p-4 text-sm text-zinc-800 shadow-lg transition-all duration-200 ease-out sm:p-5 motion-reduce:transition-none ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        role="region"
      >
        <p className="font-medium text-black">Utilizamos cookies necessários</p>
        <p className="mt-2 leading-6 text-zinc-600">
          Eles ajudam a identificar sua sessão anônima, manter seu carrinho de compras e garantir o
          funcionamento da loja.
        </p>
        <div className="mt-4 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          <a
            className="text-center text-sm font-medium text-zinc-700 underline underline-offset-4 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:text-left"
            href={privacyPolicyHref}
          >
            Política de Privacidade
          </a>
          <button
            className="rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            onClick={acknowledge}
            type="button"
          >
            Entendi
          </button>
        </div>
      </aside>
    </div>
  );
}
