'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiError, api } from '@/lib/api';

export function ApiStatus() {
  const status = useQuery({
    queryKey: ['backend-status'],
    queryFn: () => api.get<string>('/api'),
  });

  if (status.isPending) return <p className="mt-6 text-sm text-slate-500">Consultando backend…</p>;
  if (status.isError) {
    const message =
      status.error instanceof ApiError
        ? status.error.message
        : 'Não foi possível consultar o backend.';
    return <p className="mt-6 text-sm text-red-700">Backend indisponível: {message}</p>;
  }

  return (
    <p className="mt-6 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      API conectada: {status.data}
    </p>
  );
}
