'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { formatCurrency, filterTransactionsByPeriod } from '@/lib/utils';
import { PieChart as PieIcon } from 'lucide-react';
import { useTransactions } from '@/hooks';
import { useCategories } from '@/hooks';
import { DateFilterOption } from '@/features/dashboard/components/dashboard-date-filter';

import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

const CATEGORY_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

interface CategoryPieData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface CategoryDistributionChartProps {
  period?: DateFilterOption;
}

export function CategoryDistributionChart({ period }: CategoryDistributionChartProps) {
  const { activeWorkspaceId, workspaces } = useWorkspaceStore();
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const currency = activeWs?.currency || 'PEN';
  const { data: pageData, isLoading: isLoadingTx } = useTransactions(0, 200);
  const { data: categories = [], isLoading: isLoadingCat } = useCategories('EXPENSE');

  const { chartData, totalExpenses } = React.useMemo(() => {
    if (!pageData?.content || pageData.content.length === 0) {
      return { chartData: [], totalExpenses: 0 };
    }

    const filteredTx = filterTransactionsByPeriod(pageData.content, period);
    const catMap: Record<string, { name: string; value: number }> = {};
    let grandTotal = 0;

    filteredTx.forEach((tx) => {
      if (tx.type !== 'EXPENSE') return;

      const catName = tx.categoryName || 'Otros Gastos';
      if (!catMap[catName]) {
        catMap[catName] = { name: catName, value: 0 };
      }
      catMap[catName].value += tx.amount;
      grandTotal += tx.amount;
    });

    const entries = Object.values(catMap);
    entries.sort((a, b) => b.value - a.value);

    const formattedData: CategoryPieData[] = entries.map((item, idx) => ({
      name: item.name,
      value: item.value,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      percentage: grandTotal > 0 ? Math.round((item.value / grandTotal) * 100) : 0,
    }));

    return {
      chartData: formattedData,
      totalExpenses: grandTotal,
    };
  }, [pageData]);

  const isLoading = isLoadingTx || isLoadingCat;
  const hasData = chartData.length > 0;

  return (
    <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-xl space-y-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <PieIcon className="w-4 h-4" />
          </span>
          <h3 className="font-bold text-base text-white">Gastos por Categoría</h3>
        </div>
        <p className="text-xs text-gray-400">Distribución porcentual del presupuesto consumido este mes</p>
      </div>

      {/* Content Container */}
      <div className="py-2 flex-1 flex flex-col justify-center">
        {isLoading ? (
          <div className="w-full h-56 rounded-xl bg-gray-900/60 animate-pulse border border-gray-800/50 flex items-center justify-center text-xs text-gray-500">
            Cargando desglose por categoría...
          </div>
        ) : !hasData ? (
          <div className="w-full h-56 rounded-xl bg-gray-900/40 border border-gray-800/40 border-dashed flex flex-col items-center justify-center p-6 text-center space-y-1">
            <p className="text-xs font-bold text-gray-300">Sin egresos registrados</p>
            <p className="text-[11px] text-gray-500">Tus gastos por categoría aparecerán representados aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            {/* Donut Chart */}
            <div className="h-52 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as CategoryPieData;
                        return (
                          <div className="rounded-xl bg-[#090d16] border border-gray-800 p-3 shadow-2xl space-y-1 text-xs">
                            <p className="font-bold text-white flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                              {data.name}
                            </p>
                            <p className="text-indigo-400 font-semibold">
                              {formatCurrency(data.value, currency)} ({data.percentage}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Overlay Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Gastado</span>
                <span className="text-xs font-extrabold text-white">
                  {formatCurrency(totalExpenses, currency)}
                </span>
              </div>
            </div>

            {/* Custom Interactive Legend List */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
              {chartData.slice(0, 6).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-xl bg-gray-900/60 border border-gray-800/60 hover:bg-gray-800/50 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-300 font-medium truncate">{item.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block font-bold text-white">{formatCurrency(item.value, currency)}</span>
                    <span className="block text-[10px] text-gray-400">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
