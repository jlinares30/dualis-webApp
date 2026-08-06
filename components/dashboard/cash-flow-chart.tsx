'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, Calendar } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';

interface CashFlowData {
  month: string;
  ingresos: number;
  gastos: number;
}

const mockData: CashFlowData[] = [
  { month: 'Ene', ingresos: 3500, gastos: 2100 },
  { month: 'Feb', ingresos: 3600, gastos: 2300 },
  { month: 'Mar', ingresos: 3800, gastos: 1950 },
  { month: 'Abr', ingresos: 3700, gastos: 2400 },
  { month: 'May', ingresos: 4100, gastos: 2200 },
  { month: 'Jun', ingresos: 3900, gastos: 2150 },
  { month: 'Jul', ingresos: 4200, gastos: 2050 },
];

export function CashFlowChart() {
  const { data: pageData, isLoading } = useTransactions(0, 100);

  // Generar meses acumulados dinámicos desde transacciones reales
  const chartData = React.useMemo(() => {
    if (!pageData?.content || pageData.content.length === 0) return [];
    
    const monthMap: Record<string, { month: string; ingresos: number; gastos: number }> = {};
    
    pageData.content.forEach((tx) => {
      if (!tx.transactionDate) return;
      const date = new Date(tx.transactionDate);
      const monthKey = date.toLocaleDateString('es-PE', { month: 'short' });
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { month: monthKey, ingresos: 0, gastos: 0 };
      }
      
      if (tx.type === 'INCOME') {
        monthMap[monthKey].ingresos += tx.amount;
      } else {
        monthMap[monthKey].gastos += tx.amount;
      }
    });

    return Object.values(monthMap);
  }, [pageData]);

  const hasData = chartData.length > 0;

  return (
    <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-white">Flujo de Efectivo</h3>
            {hasData && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" /> En Vivo
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">Comparativa de ingresos vs gastos en los últimos meses</p>
        </div>

        {hasData && (
          <div className="flex items-center gap-4 text-xs font-semibold">
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

      {/* Chart Container */}
      <div className="h-64 w-full pt-2">
        {isLoading ? (
          <div className="w-full h-full rounded-xl bg-gray-900/60 animate-pulse border border-gray-800/50 flex items-center justify-center text-xs text-gray-500">
            Cargando gráfico de flujo de efectivo...
          </div>
        ) : !hasData ? (
          <div className="w-full h-full rounded-xl bg-gray-900/40 border border-gray-800/40 border-dashed flex flex-col items-center justify-center p-6 text-center space-y-1">
            <p className="text-xs font-bold text-gray-300">Sin datos de flujo de efectivo aún</p>
            <p className="text-[11px] text-gray-500">Registra tus primeros ingresos y gastos para visualizar tu curva comparativa.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `S/ ${val}`}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl bg-[#090d16] border border-gray-800 p-3 shadow-2xl space-y-1.5 text-xs">
                        <p className="font-bold text-gray-200 border-b border-gray-800 pb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-indigo-400" /> {label}
                        </p>
                        <p className="text-emerald-400 font-semibold flex justify-between gap-4">
                          <span>Ingresos:</span>
                          <span>{formatCurrency((payload[0]?.value as number) || 0, 'PEN')}</span>
                        </p>
                        <p className="text-rose-400 font-semibold flex justify-between gap-4">
                          <span>Gastos:</span>
                          <span>{formatCurrency((payload[1]?.value as number) || 0, 'PEN')}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="ingresos"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorIngresos)"
              />
              <Area
                type="monotone"
                dataKey="gastos"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorGastos)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
