'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionMonitor } from './session-monitor';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutos de cache
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              // No reintentar si el token expiró o no está autorizado
              if (error?.status === 401) return false;
              return failureCount < 1;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionMonitor />
      {children}
    </QueryClientProvider>
  );
}
