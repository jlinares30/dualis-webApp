'use client';

import React from 'react';
import { Wallet, TrendingDown, Users, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { WorkspaceType } from '@/types/finance';
import { useDashboardSummary } from '@/hooks/useFinanceQuery';

interface SummaryCardsProps {
  workspace: WorkspaceType;
}

export function SummaryCards({ workspace }: SummaryCardsProps) {
  const isCouple = workspace === 'couple';
  const { data, isLoading } = useDashboardSummary();

  const metrics = [
    {
      title: isCouple ? 'Fondo Pareja Disponible' : 'Total Disponible',
      amount: data ? data.totalLiquidity : (isCouple ? 4850000 : 3200000),
      change: data ? `${data.savingsRate.toFixed(1)}%` : '+8.2%',
      isPositive: true,
      icon: Wallet,
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      borderColor: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      subtext: data ? `Ahorro neto: ${formatCurrency(data.netSavings, data.currency || 'COP')}` : (isCouple ? 'Cuentas compartidas sincronizadas' : 'En 3 cuentas activas'),
    },
    {
      title: 'Gastos del Mes',
      amount: data ? data.monthlyExpenses : (isCouple ? 2150000 : 1450000),
      change: data ? `Ingresos: ${formatCurrency(data.monthlyIncome, data.currency || 'COP')}` : '-4.1%',
      isPositive: true,
      icon: TrendingDown,
      gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
      borderColor: 'border-rose-500/20',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      subtext: data ? `${data.exceededBudgetsCount} presupuestos excedidos` : 'Presupuesto mensual bajo control',
    },
    {
      title: isCouple ? 'Balance de Liquidación' : 'Balance Compartido',
      amount: data ? Math.abs(data.partnerDebtBalance) : (isCouple ? 180000 : 85000),
      change: data ? (data.partnerDebtStatus || 'Pendiente') : (isCouple ? 'A favor tuyo' : 'Pendiente'),
      isPositive: true,
      icon: Users,
      gradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
      borderColor: 'border-indigo-500/20',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      subtext: data 
        ? (data.partnerDebtBalance >= 0 ? 'Te deben esta cantidad' : 'Debes esta cantidad a tu pareja')
        : (isCouple ? 'Sofía te debe $180.000 COP' : 'Tu cuota del mes saldada'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {metrics.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} bg-[#0f172a]/90 border ${item.borderColor} p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:translate-y-[-2px]`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
                {item.title}
              </span>
              <div className={`p-2 rounded-xl border ${item.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {isLoading ? (
                  <span className="inline-block w-24 h-7 bg-gray-800 animate-pulse rounded-lg" />
                ) : (
                  formatCurrency(item.amount, data?.currency || 'COP')
                )}
              </h3>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ArrowUpRight className="w-3 h-3" />
                {item.change}
              </span>
            </div>

            <p className="text-[11px] text-gray-400 font-medium">
              {item.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}


