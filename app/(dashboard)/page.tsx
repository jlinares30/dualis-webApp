'use client';

import React from 'react';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { BudgetWidget } from '@/components/dashboard/budget-widget';
import { CashFlowChart } from '@/components/dashboard/cash-flow-chart';
import { WorkspaceType } from '@/types/finance';
import { HeartHandshake, User, Sparkles } from 'lucide-react';

interface DashboardPageProps {
  workspace?: WorkspaceType;
}

export default function DashboardPage({ workspace = 'couple' }: DashboardPageProps) {
  const isCouple = workspace === 'couple';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Dashboard Financiero
            </span>
            <span className="text-xs font-medium text-gray-400">
              {isCouple ? 'Espacio Compartido con Sofía' : 'Espacio Personal'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Hola, Jorge 👋
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            {isCouple 
              ? 'Aquí tienes el resumen financiero sincronizado de tu vida en pareja.' 
              : 'Resumen consolidado de tus ingresos y gastos personales.'}
          </p>
        </div>

        {/* Quick Actions Component */}
        <QuickActions />
      </div>

      {/* Financial Summary Metric Cards */}
      <SummaryCards workspace={workspace} />

      {/* Cash Flow Chart */}
      <CashFlowChart />

      {/* Two Column Grid: Transactions & Budget Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions workspace={workspace} />
        </div>
        <div className="lg:col-span-1">
          <BudgetWidget />
        </div>
      </div>
    </div>
  );
}
