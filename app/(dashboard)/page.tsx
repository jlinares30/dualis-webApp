'use client';

import React from 'react';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { BudgetWidget } from '@/components/dashboard/budget-widget';
import { CashFlowChart } from '@/components/dashboard/cash-flow-chart';
import { CategoryDistributionChart } from '@/components/dashboard/category-distribution-chart';
import { SavingsRateGauge } from '@/components/dashboard/savings-rate-gauge';
import { PartnerComparisonChart } from '@/components/dashboard/partner-comparison-chart';
import { NetWorthTrendChart } from '@/components/dashboard/net-worth-trend-chart';
import { ExpenseHeatmapChart } from '@/components/dashboard/expense-heatmap-chart';
import { MonthlyTrendBarChart } from '@/components/dashboard/monthly-trend-bar-chart';
import { FixedVsVariableChart } from '@/components/dashboard/fixed-vs-variable-chart';
import { WorkspaceType } from '@/types/finance';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { Sparkles } from 'lucide-react';

interface DashboardPageProps {
  workspace?: WorkspaceType;
}

export default function DashboardPage({ workspace = 'personal' }: DashboardPageProps) {
  const { hasPartner, partnerName } = useWorkspaceStore();
  const isCouple = hasPartner && workspace === 'couple';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Dashboard Financiero Analytics
            </span>
            <span className="text-xs font-medium text-gray-400">
              {isCouple ? `Espacio Compartido con ${partnerName || 'tu pareja'}` : 'Espacio Personal'}
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            {isCouple
              ? 'Análisis en tiempo real y flujo financiero sincronizado en pareja.'
              : 'Resumen consolidado e indicadores de rendimiento de tus finanzas personales.'}
          </p>
        </div>

        {/* Quick Actions Component */}
        <QuickActions />
      </div>

      {/* Financial Summary Metric Cards */}
      <SummaryCards workspace={workspace} />

      {/* Main Cash Flow Chart */}
      <CashFlowChart />

      {/* Two Column Grid: Category Distribution & Savings Rate Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryDistributionChart />
        <SavingsRateGauge />
      </div>

      {/* Historical Monthly Trend & Heatmap Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyTrendBarChart />
        <ExpenseHeatmapChart />
      </div>

      {/* Secondary Analytics Row: Fixed vs Variable & Net Worth / Partner Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <FixedVsVariableChart />
        </div>
        <div className="lg:col-span-1">
          {isCouple ? (
            <PartnerComparisonChart />
          ) : (
            <NetWorthTrendChart />
          )}
        </div>
        <div className="lg:col-span-1">
          <BudgetWidget />
        </div>
      </div>

      {/* Recent Transactions List */}
      <RecentTransactions workspace={workspace} />
    </div>
  );
}
