import React from 'react';
import { Users, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { WorkspaceType, Transaction } from '@/types/finance';
import { useTransactions } from '@/hooks/useTransactions';
import { getTransactionIconAndStyle } from '@/lib/transaction-icons';

interface RecentTransactionsProps {
  workspace: WorkspaceType;
}

export function RecentTransactions({ workspace }: RecentTransactionsProps) {
  const { data: pageData, isLoading } = useTransactions(0, 5);

  const transactions: Transaction[] = pageData?.content
    ? pageData.content.map((dto) => ({
        id: dto.id,
        title: dto.description || 'Sin concepto',
        category: (dto.categoryName as any) || 'General',
        categoryLabel: dto.categoryName || 'General',
        amount: dto.amount,
        currency: dto.currency || 'PEN',
        date: dto.transactionDate ? new Date(dto.transactionDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : 'Hoy',
        type: dto.type === 'INCOME' ? 'income' : 'expense',
        workspace: 'personal',
        paidBy: dto.paidByUserName,
      }))
    : [];

  return (
    <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base text-white">Últimos Movimientos</h3>
          <p className="text-xs text-gray-400">Historial reciente de gastos e ingresos</p>
        </div>
        <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">
          Ver todo
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-900/60 animate-pulse border border-gray-800/50" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500">
            No tienes transacciones registradas aún.
          </div>
        ) : (
          transactions.map((tx) => {
            const { Icon, badgeClass } = getTransactionIconAndStyle(tx.type, tx.categoryLabel, tx.title);
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-900/60 border border-gray-800/50 hover:border-gray-700/80 transition-all duration-200"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl border ${badgeClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-100">{tx.title}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md">
                        <User className="w-3 h-3" /> Personal
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{tx.categoryLabel || tx.category}</span>
                      <span>•</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-bold text-sm block ${
                      isIncome ? 'text-emerald-400' : 'text-gray-100'
                    }`}
                  >
                    {isIncome ? '+' : '-'} {formatCurrency(tx.amount, tx.currency || 'PEN')}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">Exitoso</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
