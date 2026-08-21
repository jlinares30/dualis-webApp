import { TransactionDTO } from '@/types';
import { formatCurrency } from '@/lib/utils';

/**
 * Convierte un arreglo de transacciones en un archivo CSV formateado compatible con Excel.
 */
export function exportTransactionsToCSV(transactions: TransactionDTO[], filename = 'dualis_transacciones.csv') {
  if (!transactions || transactions.length === 0) return;

  const headers = ['ID', 'Fecha', 'Tipo', 'Categoría', 'Cuenta', 'Descripción', 'Monto', 'Moneda'];

  const rows = transactions.map((tx) => {
    const typeLabel = tx.type === 'INCOME' ? 'Ingreso' : tx.type === 'EXPENSE' ? 'Gasto' : 'Transferencia';
    const dateFormatted = tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString('es-PE') : '';

    return [
      `"${tx.id}"`,
      `"${dateFormatted}"`,
      `"${typeLabel}"`,
      `"${tx.categoryName || 'Sin categoría'}"`,
      `"${tx.accountName || 'Cuenta'}"`,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      tx.amount,
      `"${tx.currency || 'PEN'}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  // Agregar UTF-8 BOM (\uFEFF) para que Microsoft Excel reconozca tildes y caracteres especiales
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
