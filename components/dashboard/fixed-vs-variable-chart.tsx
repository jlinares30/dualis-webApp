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
import { Layers, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { DateFilterOption } from '@/components/dashboard/dashboard-date-filter';

interface FixedVsVariableChartProps {
  period?: DateFilterOption;
}

export function FixedVsVariableChart({ period }: FixedVsVariableChartProps) {
  const { data: pageData, isLoading } = useTransactions(0, 200);

  const { fixedAmount, variableAmount, totalExpenses, chartData } = React.useMemo(() => {
    if (!pageData?.content || pageData.content.length === 0) {
      return { fixedAmount: 0, variableAmount: 0, totalExpenses: 0, chartData: [] };
    }

    const filteredTx = filterTransactionsByPeriod(pageData.content, period);
    let fixed = 0;
    let variable = 0;

    const fixedCategories = ['Vivienda', 'Servicios', 'Salud', 'Educación', 'Préstamos', 'Alquiler'];

    filteredTx.forEach((tx) => {
      if (tx.type !== 'EXPENSE') return;

      const catName = tx.categoryName || '';
      const isFixed = fixedCategories.some((fc) => catName.toLowerCase().includes(fc.toLowerCase()));

      if (isFixed) {
        fixed += tx.amount;
      } else {
        variable += tx.amount;
      }
    });

    const total = fixed + variable;

    return {
      fixedAmount: fixed,
      variableAmount: variable,
      totalExpenses: total,
      chartData: [
        { name: 'Gastos Fijos/Obligatorios', value: fixed, color: '#3b82f6' },
        { name: 'Gastos Variables/Estilo de Vida', value: variable, color: '#f59e0b' },
      ],
    };
  }, [pageData]);

  const hasData = totalExpenses > 0;
  const fixedPct = totalExpenses > 0 ? Math.round((fixedAmount / totalExpenses) * 100) : 0;
  const varPct = totalExpenses > 0 ? Math.round((variableAmount / totalExpenses) * 100) : 0;

  return (
    <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-xl space-y-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base text-white">Gastos Fijos vs Variables</h3>
          </div>
          <p className="text-xs text-gray-400">Separación de egresos obligatorios vs estilo de vida</p>
        </div>
      </div>

      {/* Content */}
      <div className="py-2">
        {isLoading ? (
          <div className="w-full h-44 rounded-xl bg-gray-900/60 animate-pulse border border-gray-800/50 flex items-center justify-center text-xs text-gray-500">
            Clasificando egresos fijos y variables...
          </div>
        ) : !hasData ? (
          <div className="w-full h-44 rounded-xl bg-gray-900/40 border border-gray-800/40 border-dashed flex flex-col items-center justify-center p-6 text-center space-y-1">
            <p className="text-xs font-bold text-gray-300">Sin egresos clasificados</p>
            <p className="text-[11px] text-gray-500">Los egresos fijos y variables aparecerán ponderados aquí.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-32 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl bg-[#090d16] border border-gray-800 p-3 shadow-2xl space-y-1 text-xs">
                            <p className="font-bold text-white flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                              {data.name}
                            </p>
                            <p className="text-amber-400 font-semibold">
                              {formatCurrency(data.value, 'PEN')}
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
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center justify-between">
                <div>
                  <span className="block font-semibold">Gastos Fijos</span>
                  <span className="text-[10px] text-gray-400">{fixedPct}% del egreso</span>
                </div>
                <span className="font-bold text-white">{formatCurrency(fixedAmount, 'PEN')}</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-between">
                <div>
                  <span className="block font-semibold">Gastos Variables</span>
                  <span className="text-[10px] text-gray-400">{varPct}% del egreso</span>
                </div>
                <span className="font-bold text-white">{formatCurrency(variableAmount, 'PEN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
