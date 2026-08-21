'use client';

import React from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { exportTransactionsToCSV } from '@/lib/export-utils';
import { TransactionDTO } from '@/types';

interface ExportButtonProps {
  transactions: TransactionDTO[];
  filename?: string;
  className?: string;
}

export function ExportButton({ transactions, filename, className = '' }: ExportButtonProps) {
  const handleExport = () => {
    exportTransactionsToCSV(transactions, filename);
  };

  const isDisabled = !transactions || transactions.length === 0;

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isDisabled}
      className={`px-3 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm ${className}`}
      title="Exportar reporte a Microsoft Excel (.csv)"
    >
      <FileSpreadsheet className="w-3.5 h-3.5" />
      <span>Exportar a Excel</span>
    </button>
  );
}
