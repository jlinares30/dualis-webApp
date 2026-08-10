import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'PEN'): string {
  const formatted = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);

  // Replace non-breaking spaces with standard space to avoid hydration mismatch between Node and Browser
  return formatted.replace(/\u00a0/g, ' ');
}

export function filterTransactionsByPeriod<T extends { transactionDate?: string }>(
  items: T[],
  period?: 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'ALL_TIME'
): T[] {
  if (!items || items.length === 0 || !period || period === 'ALL_TIME') {
    return items || [];
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return items.filter((item) => {
    if (!item.transactionDate) return true; // Mantener si no tiene fecha estricta para evitar perder datos sin fecha
    const date = new Date(item.transactionDate);
    const itemMonth = date.getMonth();
    const itemYear = date.getFullYear();

    if (period === 'THIS_MONTH') {
      return itemMonth === currentMonth && itemYear === currentYear;
    }

    if (period === 'LAST_MONTH') {
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
      return itemMonth === lastMonthDate.getMonth() && itemYear === lastMonthDate.getFullYear();
    }

    if (period === 'LAST_3_MONTHS') {
      const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
      return date >= threeMonthsAgo;
    }

    return true;
  });
}
