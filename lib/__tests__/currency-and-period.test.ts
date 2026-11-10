import { describe, expect, it } from 'vitest';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';
import { filterTransactionsByPeriod } from '@/lib/utils';

describe('exchange rate conversion', () => {
  it('converts through USD with the reference rates', () => {
    useExchangeRateStore.getState().resetToDefaults();
    const { convert } = useExchangeRateStore.getState();
    expect(convert(100, 'USD', 'PEN')).toBe(375);
    expect(convert(375, 'PEN', 'USD')).toBe(100);
    expect(convert(50, 'PEN', 'PEN')).toBe(50);
  });
});

describe('filterTransactionsByPeriod', () => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 10).toISOString();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString();
  const items = [{ transactionDate: thisMonth }, { transactionDate: lastMonth }];

  it('filters by this and last month', () => {
    expect(filterTransactionsByPeriod(items, 'THIS_MONTH')).toHaveLength(1);
    expect(filterTransactionsByPeriod(items, 'LAST_MONTH')[0].transactionDate).toBe(lastMonth);
    expect(filterTransactionsByPeriod(items, 'ALL_TIME')).toHaveLength(2);
  });
});
