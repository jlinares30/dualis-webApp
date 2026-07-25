import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'COP'): string {
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);

  // Replace non-breaking spaces with standard space to avoid hydration mismatch between Node and Browser
  return formatted.replace(/\u00a0/g, ' ');
}
