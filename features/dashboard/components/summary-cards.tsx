'use client';

import React from 'react';
import { Wallet, TrendingDown, Users, ArrowUpRight } from 'lucide-react';
import { formatCurrency, filterTransactionsByPeriod } from '@/lib/utils';
import { WorkspaceType } from '@/types';
import { useDashboardSummary } from '@/hooks';
import { useTransactions } from '@/hooks';
import { DateFilterOption } from '@/features/dashboard/components/dashboard-date-filter';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';
import { useAccounts } from '@/features/accounts';

interface SummaryCardsProps {
  workspace: WorkspaceType;
  period?: DateFilterOption;
}

export function SummaryCards({ workspace, period }: SummaryCardsProps) {
  const isCouple = workspace === 'couple';
  const { activeWorkspaceId, workspaces } = useWorkspaceStore();
  const { user } = useAuthStore();
  const convert = useExchangeRateStore((s) => s.convert);
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);

  const { data: summaryData, isLoading: isLoadingSummary } = useDashboardSummary();
  const { data: txPage, isLoading: isLoadingTx } = useTransactions(0, 200);
  const { data: accountsList, isLoading: isLoadingAccounts } = useAccounts();

  const currency = (activeWs?.currency || summaryData?.currency || user?.preferredCurrency || 'PEN').toUpperCase();

  // Desglose por moneda real de las cuentas
  const currencyBreakdown = React.useMemo(() => {
    if (!accountsList || accountsList.length === 0) return [];
    const map: { [curr: string]: number } = {};
    accountsList.forEach((acc) => {
      // Si la cuenta no tiene moneda asignada, se asume la moneda nativa del workspace (currency)
      const c = (acc.currency && acc.currency.trim() ? acc.currency : currency).toUpperCase();
      map[c] = (map[c] || 0) + (acc.balance || 0);
    });
    return Object.entries(map).map(([curr, amount]) => ({
      currency: curr,
      amount,
    }));
  }, [accountsList, currency]);

  // Total convertido a la moneda base del espacio
  const convertedTotalBalance = React.useMemo(() => {
    if (!accountsList || accountsList.length === 0) {
      return summaryData?.totalBalance ?? summaryData?.totalLiquidity ?? 0;
    }
    return accountsList.reduce((acc, account) => {
      const accCurr = (account.currency && account.currency.trim() ? account.currency : currency).toUpperCase();
      // Si la cuenta ya está en la misma moneda que el espacio, no se convierte
      if (accCurr === currency) {
        return acc + (account.balance || 0);
      }
      return acc + convert(account.balance || 0, accCurr, currency);
    }, 0);
  }, [accountsList, summaryData?.totalBalance, summaryData?.totalLiquidity, currency, convert]);

  const { monthlyIncome, monthlyExpenses, netSavings, savingsRate } = React.useMemo(() => {
    if (!txPage?.content || txPage.content.length === 0) {
      return {
        monthlyIncome: summaryData?.monthlyIncome || 0,
        monthlyExpenses: summaryData?.monthlyExpenses || 0,
        netSavings: summaryData?.netSavings || 0,
        savingsRate: summaryData?.savingsRatePercentage || 0,
      };
    }

    const filtered = filterTransactionsByPeriod(txPage.content, period);
    let inc = 0;
    let exp = 0;

    filtered.forEach((tx) => {
      if (tx.type === 'INCOME') inc += tx.amount;
      if (tx.type === 'EXPENSE') exp += tx.amount;
    });

    const net = inc - exp;
    const rate = inc > 0 ? (net / inc) * 100 : 0;

    return {
      monthlyIncome: inc,
      monthlyExpenses: exp,
      netSavings: net,
      savingsRate: rate,
    };
  }, [txPage, summaryData, period]);

  const exceededCount = summaryData?.exceededBudgetsCount ?? 0;
  const isLoading = isLoadingSummary || isLoadingTx || isLoadingAccounts;

  const metrics = [
    {
      title: 'Total Disponible',
      amount: convertedTotalBalance,
      change: `${savingsRate.toFixed(1)}%`,
      isPositive: true,
      icon: Wallet,
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      borderColor: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      subtext: `Ahorro neto: ${formatCurrency(netSavings, currency)}`,
      showBreakdown: true,
    },
    {
      title: 'Gastos del Periodo',
      amount: monthlyExpenses,
      change: `Ingresos: ${formatCurrency(monthlyIncome, currency)}`,
      isPositive: true,
      icon: TrendingDown,
      gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
      borderColor: 'border-rose-500/20',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      subtext: `${exceededCount} presupuestos excedidos`,
      showBreakdown: false,
    },
    {
      title: 'Ingresos del Periodo',
      amount: monthlyIncome,
      change: '0%',
      isPositive: true,
      icon: Users,
      gradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
      borderColor: 'border-indigo-500/20',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      subtext: 'Acumulado de ingresos en el periodo seleccionado',
      showBreakdown: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {metrics.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.gradient} bg-[#0f172a]/90 border ${item.borderColor} p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:translate-y-[-2px] flex flex-col justify-between`}
          >
            <div>
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
                    formatCurrency(item.amount, currency)
                  )}
                </h3>
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ArrowUpRight className="w-3 h-3" />
                  {item.change}
                </span>
              </div>
            </div>

            <div>
              {/* Desglose por moneda cuando aplique */}
              {item.showBreakdown && currencyBreakdown.length > 1 && (
                <div className="my-2 pt-2 border-t border-gray-800/80">
                  <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Desglose por divisa:</span>
                    <span className="text-gray-400 text-[10px] lowercase">tasa conv.</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currencyBreakdown.map((b) => (
                      <span
                        key={b.currency}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-800/80 text-gray-200 border border-gray-700/60"
                      >
                        {formatCurrency(b.amount, b.currency)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-gray-400 font-medium mt-1">
                {item.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}


