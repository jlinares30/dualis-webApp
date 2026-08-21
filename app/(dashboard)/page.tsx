'use client';

import React, { useState } from 'react';
import { 
  SummaryCards,
  QuickActions,
  RecentTransactions,
  CashFlowChart,
  CategoryDistributionChart,
  SavingsRateGauge,
  NetWorthTrendChart,
  ExpenseHeatmapChart,
  MonthlyTrendBarChart,
  FixedVsVariableChart,
  DashboardDateFilter,
  DateFilterOption,
} from '@/features/dashboard';
import { BudgetWidget } from '@/features/budgets';
import { GoalsWidget } from '@/features/goals';
import { UpcomingBillsWidget } from '@/features/subscriptions';
import { PartnerComparisonChart } from '@/features/settlements';
import { WorkspaceType } from '@/types';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { Sparkles } from 'lucide-react';

interface DashboardPageProps {
  workspace?: WorkspaceType;
}

export default function DashboardPage({ workspace = 'personal' }: DashboardPageProps) {
  const { hasPartner, partnerName } = useWorkspaceStore();
  const isCouple = hasPartner && workspace === 'couple';
  const [selectedPeriod, setSelectedPeriod] = useState<DateFilterOption>('THIS_MONTH');

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

        <div className="flex items-center gap-3">
          <DashboardDateFilter selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />
          <QuickActions />
        </div>
      </div>

      {/* Financial Summary Metric Cards */}
      <SummaryCards workspace={workspace} period={selectedPeriod} />

      {/* Main Cash Flow Chart */}
      <CashFlowChart period={selectedPeriod} />

      {/* Two Column Grid: Category Distribution & Savings Rate Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryDistributionChart period={selectedPeriod} />
        <SavingsRateGauge period={selectedPeriod} />
      </div>

      {/* Historical Monthly Trend & Heatmap Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyTrendBarChart period={selectedPeriod} />
        <ExpenseHeatmapChart period={selectedPeriod} />
      </div>

      {/* Three Column Row: Goals Widget, Upcoming Bills & Budget Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GoalsWidget />
        <UpcomingBillsWidget />
        <BudgetWidget />
      </div>

      {/* Secondary Analytics Row: Fixed vs Variable & Net Worth / Partner Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FixedVsVariableChart period={selectedPeriod} />
        {isCouple ? (
          <PartnerComparisonChart period={selectedPeriod} />
        ) : (
          <NetWorthTrendChart />
        )}
      </div>

      {/* Recent Transactions List */}
      <RecentTransactions workspace={workspace} />
    </div>
  );
}
