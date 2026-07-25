import React from 'react';
import { PieChart, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { BudgetCategory } from '@/types/finance';

const mockBudgets: BudgetCategory[] = [
  {
    id: 'b-1',
    name: 'Mercado y Alimentación',
    category: 'food',
    spent: 820000,
    limit: 1000000,
    currency: 'COP',
  },
  {
    id: 'b-2',
    name: 'Servicios Públicos',
    category: 'utilities',
    spent: 240000,
    limit: 400000,
    currency: 'COP',
  },
  {
    id: 'b-3',
    name: 'Entretenimiento & Salidas',
    category: 'entertainment',
    spent: 470000,
    limit: 500000,
    currency: 'COP',
  },
  {
    id: 'b-4',
    name: 'Transporte y Movilidad',
    category: 'transport',
    spent: 120000,
    limit: 300000,
    currency: 'COP',
  },
];

export function BudgetWidget() {
  const totalSpent = mockBudgets.reduce((acc, item) => acc + item.spent, 0);
  const totalLimit = mockBudgets.reduce((acc, item) => acc + item.limit, 0);
  const overallPercentage = Math.round((totalSpent / totalLimit) * 100);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) {
      return {
        bar: 'bg-rose-500',
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        icon: AlertTriangle,
        text: 'En Alerta',
      };
    }
    if (percentage >= 70) {
      return {
        bar: 'bg-amber-500',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: AlertCircle,
        text: 'Precaución',
      };
    }
    return {
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: CheckCircle2,
      text: 'Saludable',
    };
  };

  const overallStatus = getStatusColor(overallPercentage);
  const OverallIcon = overallStatus.icon;

  return (
    <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Estado del Presupuesto</h3>
            <p className="text-xs text-gray-400">Consumo mensual acumulado</p>
          </div>
        </div>
        <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', overallStatus.badge)}>
          <OverallIcon className="w-3.5 h-3.5" />
          <span>{overallStatus.text} ({overallPercentage}%)</span>
        </div>
      </div>

      {/* Main Overall Progress */}
      <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2">
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-gray-400">Gasto Total Acumulado</span>
          <span className="font-bold text-white">
            {formatCurrency(totalSpent, 'COP')} <span className="text-gray-400 font-normal">/ {formatCurrency(totalLimit, 'COP')}</span>
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-gray-800 overflow-hidden p-0.5">
          <div
            className={cn('h-full rounded-full transition-all duration-500', overallStatus.bar)}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Category Breakdown list */}
      <div className="space-y-3.5">
        {mockBudgets.map((item) => {
          const pct = Math.round((item.spent / item.limit) * 100);
          const status = getStatusColor(pct);

          return (
            <div key={item.id} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-gray-200">{item.name}</span>
                <span className="text-gray-400">
                  <span className="font-semibold text-gray-100">{formatCurrency(item.spent, 'COP')}</span> ({pct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-300', status.bar)}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
