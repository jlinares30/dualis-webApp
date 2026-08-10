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
  Cell,
} from 'recharts';
import { formatCurrency, filterTransactionsByPeriod } from '@/lib/utils';
import { CalendarDays, Flame } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { DateFilterOption } from '@/components/dashboard/dashboard-date-filter';

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_COLORS = ['#f43f5e', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

interface ExpenseHeatmapChartProps {
  period?: DateFilterOption;
}

export function ExpenseHeatmapChart({ period }: ExpenseHeatmapChartProps) {
  const { data: pageData, isLoading } = useTransactions(0, 200);

  const { chartData, peakDay, peakAmount } = React.useMemo(() => {
    if (!pageData?.content || pageData.content.length === 0) {
      return {
        chartData: DAYS_OF_WEEK.map((day, idx) => ({ day, total: 0, color: DAY_COLORS[idx] })),
        peakDay: '-',
        peakAmount: 0,
      };
    }

    const filteredTx = filterTransactionsByPeriod(pageData.content, period);
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];

    filteredTx.forEach((tx) => {
      if (tx.type !== 'EXPENSE' || !tx.transactionDate) return;
      const date = new Date(tx.transactionDate);
      const dayIdx = date.getDay(); // 0 = Dom, 6 = Sáb
      dayTotals[dayIdx] += tx.amount;
    });

    let maxIdx = 0;
    let maxVal = 0;

    dayTotals.forEach((val, idx) => {
      if (val > maxVal) {
        maxVal = val;
        maxIdx = idx;
      }
    });

    const formattedData = DAYS_OF_WEEK.map((day, idx) => ({
      day,
      total: dayTotals[idx],
      color: DAY_COLORS[idx],
    }));

    return {
      chartData: formattedData,
      peakDay: DAYS_OF_WEEK[maxIdx],
      peakAmount: maxVal,
    };
  }, [pageData]);

  const hasData = peakAmount > 0;

  return (
    <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-xl space-y-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <CalendarDays className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base text-white">Ritmo de Gasto por Día</h3>
          </div>
          <p className="text-xs text-gray-400">Análisis de egresos acumulados por día de la semana</p>
        </div>

        {hasData && (
          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1">
            <Flame className="w-3 h-3" /> Día de pico: {peakDay} ({formatCurrency(peakAmount, 'PEN')})
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="py-2">
        {isLoading ? (
          <div className="w-full h-44 rounded-xl bg-gray-900/60 animate-pulse border border-gray-800/50 flex items-center justify-center text-xs text-gray-500">
            Calculando días de mayor gasto...
          </div>
        ) : !hasData ? (
          <div className="w-full h-44 rounded-xl bg-gray-900/40 border border-gray-800/40 border-dashed flex flex-col items-center justify-center p-6 text-center space-y-1">
            <p className="text-xs font-bold text-gray-300">Sin datos de egresos semanales</p>
            <p className="text-[11px] text-gray-500">Registra tus gastos para detectar los días de mayor consumo.</p>
          </div>
        ) : (
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `S/ ${val}`} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl bg-[#090d16] border border-gray-800 p-3 shadow-2xl space-y-1 text-xs">
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                            Día: {data.day}
                          </p>
                          <p className="text-rose-400 font-semibold">
                            Total Gastado: {formatCurrency(data.total, 'PEN')}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={28}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
