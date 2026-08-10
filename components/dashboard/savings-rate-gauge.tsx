'use client';

import React from 'react';
import { formatCurrency, filterTransactionsByPeriod } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, Sparkles, ArrowUpRight, PiggyBank } from 'lucide-react';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { useTransactions } from '@/hooks/useTransactions';
import { DateFilterOption } from '@/components/dashboard/dashboard-date-filter';

interface SavingsRateGaugeProps {
  period?: DateFilterOption;
}

export function SavingsRateGauge({ period }: SavingsRateGaugeProps) {
  const { data: summary, isLoading: isLoadingSummary } = useDashboardSummary();
  const { data: txPage, isLoading: isLoadingTx } = useTransactions(0, 200);

  const { totalIncome, totalExpenses, netSavings, savingsRate } = React.useMemo(() => {
    if (!txPage?.content || txPage.content.length === 0) {
      const inc = summary?.monthlyIncome || 0;
      const exp = summary?.monthlyExpenses || 0;
      const net = summary?.netSavings !== undefined ? summary.netSavings : inc - exp;
      const rate = summary?.savingsRatePercentage !== undefined ? Math.round(summary.savingsRatePercentage) : (inc > 0 ? Math.round((net / inc) * 100) : 0);
      return { totalIncome: inc, totalExpenses: exp, netSavings: net, savingsRate: rate };
    }

    const filtered = filterTransactionsByPeriod(txPage.content, period);
    let inc = 0;
    let exp = 0;

    filtered.forEach((tx) => {
      if (tx.type === 'INCOME') inc += tx.amount;
      if (tx.type === 'EXPENSE') exp += tx.amount;
    });

    const net = inc - exp;
    const rate = inc > 0 ? Math.round((net / inc) * 100) : 0;

    return { totalIncome: inc, totalExpenses: exp, netSavings: net, savingsRate: rate };
  }, [txPage, summary, period]);

  const isLoading = isLoadingSummary || isLoadingTx;
  const boundedRate = Math.max(0, Math.min(100, savingsRate));

  let healthBadge = {
    label: 'Saludable',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: ShieldCheck,
    text: 'Tu nivel de retención de ingresos está dentro del rango óptimo recomendados (Regla 50/30/20).',
  };

  if (savingsRate > 25) {
    healthBadge = {
      label: 'Excelente',
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      icon: Sparkles,
      text: '¡Superas el 25% de tasa de ahorro! Gran capacidad de generación de riqueza.',
    };
  } else if (savingsRate < 0) {
    healthBadge = {
      label: 'Alerta de Gasto',
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      icon: ShieldAlert,
      text: 'Tus egresos actuales superan tus ingresos del mes. Revisa tus presupuestos por categoría.',
    };
  } else if (savingsRate <= 10) {
    healthBadge = {
      label: 'Margen Ajustado',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: ShieldAlert,
      text: 'Retienes menos del 10% de tus ingresos. Intenta optimizar gastos prescindibles.',
    };
  }

  const HealthIcon = healthBadge.icon;

  return (
    <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-xl space-y-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <PiggyBank className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base text-white">Tasa de Ahorro Neto</h3>
          </div>
          <p className="text-xs text-gray-400">Porcentaje de ingresos retenidos este mes</p>
        </div>

        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${healthBadge.color}`}>
          <HealthIcon className="w-3 h-3" /> {healthBadge.label}
        </span>
      </div>

      {/* Main Gauge Visual */}
      <div className="py-2 space-y-4">
        {isLoading ? (
          <div className="w-full h-36 rounded-xl bg-gray-900/60 animate-pulse border border-gray-800/50 flex items-center justify-center text-xs text-gray-500">
            Calculando tasa de ahorro...
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {savingsRate}%
                </span>
                <span className="text-xs text-gray-400 ml-2 font-medium">de tus ingresos conservados</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {formatCurrency(netSavings, 'PEN')}
                </span>
                <span className="text-[10px] text-gray-500 block">Excedente Libre</span>
              </div>
            </div>

            {/* Visual Progress Bar Gauge */}
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-gray-900 rounded-full overflow-hidden p-0.5 border border-gray-800 flex">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 shadow-sm"
                  style={{ width: `${boundedRate}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 font-medium px-0.5">
                <span>0% (Límite)</span>
                <span>20% (Meta 50/30/20)</span>
                <span>50%+ (Inversor)</span>
              </div>
            </div>

            {/* Insight Footnote */}
            <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/60 text-xs text-gray-300 leading-relaxed">
              {healthBadge.text}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
