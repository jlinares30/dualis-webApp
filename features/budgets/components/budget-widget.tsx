import React from 'react';
import { PiggyBank, AlertTriangle, CheckCircle2, AlertCircle, ArrowRight, PieChart } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useBudgets } from '@/hooks';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import Link from 'next/link';

export function BudgetWidget() {
  const { activeWorkspaceId, workspaces } = useWorkspaceStore();
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const currency = activeWs?.currency || 'PEN';
  const { data: budgets = [], isLoading } = useBudgets();

  const totalSpent = budgets.reduce((acc, b) => acc + (b.spentAmount || 0), 0);
  const totalLimit = budgets.reduce((acc, b) => acc + (b.limitAmount || 0), 0);
  const overallPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

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
        {budgets.length > 0 && (
          <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', overallStatus.badge)}>
            <OverallIcon className="w-3.5 h-3.5" />
            <span>{overallStatus.text} ({overallPercentage}%)</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-16 rounded-xl bg-gray-900/80 animate-pulse border border-gray-800" />
          <div className="h-12 rounded-xl bg-gray-900/60 animate-pulse border border-gray-800/50" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-8 text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-400">No hay presupuestos activos</p>
          <p>Crea tu primer presupuesto para monitorear tus límites de gasto.</p>
        </div>
      ) : (
        <>
          {/* Main Overall Progress */}
          <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-gray-400">Gasto Total Acumulado</span>
              <span className="font-bold text-white">
                {formatCurrency(totalSpent, currency)}{' '}
                <span className="text-gray-400 font-normal">/ {formatCurrency(totalLimit, currency)}</span>
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
            {budgets.map((item) => {
              const spent = item.spentAmount || 0;
              const limit = item.limitAmount || 1;
              const pct = Math.round((spent / limit) * 100);
              const status = getStatusColor(pct);

              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-gray-200">{item.name}</span>
                    <span className="text-gray-400">
                      <span className="font-semibold text-gray-100">{formatCurrency(spent, item.currency || currency)}</span> ({pct}%)
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
        </>
      )}
    </div>
  );
}
