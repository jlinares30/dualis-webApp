'use client';

import { useCallback } from 'react';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

/**
 * Returns a function that converts transaction amounts to the active workspace currency, so charts never
 * add amounts of different currencies (e.g. 20 USD + 50 PEN = "70"). Uses the backend exchange rates.
 */
export function useTransactionsInWorkspaceCurrency() {
  const convert = useExchangeRateStore((s) => s.convert);
  const rates = useExchangeRateStore((s) => s.rates);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const currency = (workspaces.find((w) => w.id === activeWorkspaceId)?.currency || 'PEN').toUpperCase();

  return useCallback(
    <T extends { amount: number; currency?: string }>(items: T[]): T[] =>
      items.map((t) => {
        const from = (t.currency || currency).toUpperCase();
        return from === currency ? t : { ...t, amount: convert(t.amount, from, currency), currency };
      }),
    // rates is a dependency so conversions refresh when new rates arrive
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [convert, currency, rates]
  );
}
