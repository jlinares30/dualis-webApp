'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatCurrency, filterTransactionsByPeriod } from '@/lib/utils';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { DateFilterOption } from '@/components/dashboard/dashboard-date-filter';

import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

interface MonthlyTrendBarChartProps {
  period?: DateFilterOption;
}

export function MonthlyTrendBarChart({ period }: MonthlyTrendBarChartProps) {
  const { activeWorkspaceId, workspaces } = useWorkspaceStore();
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const currency = activeWs?.currency || 'PEN';
  const { data: pageData, isLoading } = useTransactions(0, 300);

  const { chartData } = React.useMemo(() => {
    if (!pageData?.content || pageData.content.length === 0) {
      return { chartData: [] };
    }

    const filteredTx = filterTransactionsByPeriod(pageData.content, period);
    const monthMap: Record<string, { month: string; Ingresos: number; Gastos: number }> = {};

    filteredTx.forEach((tx) => {
      if (!tx.transactionDate) return;
      const date = new Date(tx.transactionDate);
      const monthKey = date.toLocaleDateString('es-PE', { month: 'short' });

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { month: monthKey, Ingresos: 0, Gastos: 0 };
      }

      if (tx.type === 'INCOME') {
        monthMap[monthKey].Ingresos += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        monthMap[monthKey].Gastos += tx.amount;
      }
    });

    return { chartData: Object.values(monthMap) };
  }, [pageData]);

  const hasData = chartData.length > 0;

  return (
    <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-xl space-y-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base text-white">Tendencia Histórica</h3>
          </div>
          <p className="text-xs text-gray-400">Comparativa mensual de Ingresos vs Gastos acumulados</p>
        </div>

        {hasData && (
          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-gray-300">Ingresos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="text-gray-300">Gastos</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="py-2">
        {isLoading ? (
          <div className="w-full h-52 rounded-xl bg-gray-900/60 animate-pulse border border-gray-800/50 flex items-center justify-center text-xs text-gray-500">
            Cargando tendencia mensual...
          </div>
        ) : !hasData ? (
          <div className="w-full h-52 rounded-xl bg-gray-900/40 border border-gray-800/40 border-dashed flex flex-col items-center justify-center p-6 text-center space-y-1">
            <p className="text-xs font-bold text-gray-300">Sin historial mensual aún</p>
            <p className="text-[11px] text-gray-500">Tus movimientos acumulados por mes se mostrarán en esta gráfica.</p>
          </div>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl bg-[#090d16] border border-gray-800 p-3 shadow-2xl space-y-1 text-xs">
                          <p className="font-bold text-gray-200 border-b border-gray-800 pb-1">{label}</p>
                          <p className="text-emerald-400 font-semibold flex justify-between gap-4">
                            <span>Ingresos:</span>
                            <span>{formatCurrency((payload[0]?.value as number) || 0, currency)}</span>
                          </p>
                          <p className="text-rose-400 font-semibold flex justify-between gap-4">
                            <span>Gastos:</span>
                            <span>{formatCurrency((payload[1]?.value as number) || 0, currency)}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="Gastos" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
