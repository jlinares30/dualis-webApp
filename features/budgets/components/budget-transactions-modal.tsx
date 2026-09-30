'use client';

import React from 'react';
import { X, Receipt, Calendar, ArrowDownRight } from 'lucide-react';
import { BudgetDTO } from '../types/budgets';
import { useTransactions } from '@/features/transactions';
import { formatCurrency } from '@/lib/utils';

interface BudgetTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: BudgetDTO | null;
  month: number;
  year: number;
}

export function BudgetTransactionsModal({
  isOpen,
  onClose,
  budget,
  month,
  year,
}: BudgetTransactionsModalProps) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  const startDate = `${year}-${pad(month)}-01T00:00:00.000Z`;
  const endDate = `${year}-${pad(month)}-${pad(lastDay)}T23:59:59.999Z`;

  const { data: txData, isLoading } = useTransactions(
    0,
    50,
    undefined,
    'EXPENSE',
    undefined,
    startDate,
    endDate,
    budget?.categoryId
  );

  if (!isOpen || !budget) return null;

  const transactions = txData?.content || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in-50">
      <div className="relative w-full max-w-lg bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Gastos: {budget.name}</h3>
              <p className="text-xs text-gray-400">
                Detalle de movimientos imputados a este presupuesto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800/80 shrink-0">
          <div>
            <span className="text-[11px] text-gray-400">Límite Establecido</span>
            <p className="text-sm font-bold text-gray-200">{formatCurrency(budget.limitAmount, budget.currency)}</p>
          </div>
          <div>
            <span className="text-[11px] text-gray-400">Total Consumido</span>
            <p className="text-sm font-bold text-white">{formatCurrency(budget.spentAmount, budget.currency)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
          {isLoading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-gray-900/50 animate-pulse border border-gray-800/60" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Calendar className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-xs text-gray-400 font-medium">No hay transacciones registradas</p>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                No se encontraron gastos en este período asociados a este presupuesto.
              </p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-900/40 border border-gray-800/60 hover:border-gray-700/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {tx.description || tx.categoryName || 'Gasto'}
                    </p>
                    <span className="text-[10px] text-gray-400">
                      {new Date(tx.transactionDate).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {tx.accountName ? ` • ${tx.accountName}` : ''}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-rose-400">
                    -{formatCurrency(tx.amount, tx.currency)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-gray-800/80 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
