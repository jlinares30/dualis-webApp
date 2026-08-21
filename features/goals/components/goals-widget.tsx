'use client';

import React from 'react';
import Link from 'next/link';
import { Target, Plus, ChevronRight, Award, Plane, Home, Car, Laptop, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useGoals } from '@/hooks';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export function GoalsWidget() {
  const { activeWorkspaceId, workspaces } = useWorkspaceStore();
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const currency = activeWs?.currency || 'PEN';
  const { data: goals = [], isLoading } = useGoals();

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'TRAVEL': return Plane;
      case 'HOUSE': return Home;
      case 'CAR': return Car;
      case 'TECH': return Laptop;
      case 'EMERGENCY': return ShieldCheck;
      default: return Target;
    }
  };

  return (
    <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Target className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-bold text-base text-white">Metas de Ahorro</h3>
            <p className="text-xs text-gray-400">Objetivos financieros activos</p>
          </div>
        </div>

        <Link
          href="/goals"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors"
        >
          Ver Todo <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="h-28 rounded-xl bg-gray-900/60 animate-pulse border border-gray-800/50 flex items-center justify-center text-xs text-gray-500">
            Cargando metas...
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-xl bg-gray-900/40 border border-gray-800/40 border-dashed p-4 text-center space-y-2">
            <p className="text-xs text-gray-400">No tienes metas de ahorro configuradas aún.</p>
            <Link
              href="/goals"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Crear mi primera meta
            </Link>
          </div>
        ) : (
          goals.slice(0, 3).map((goal) => {
            const Icon = getCategoryIcon(goal.category);
            const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;

            return (
              <div key={goal.id} className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-bold text-white truncate max-w-[120px]">{goal.name}</span>
                  </div>
                  <span className="font-semibold text-indigo-400">{pct}%</span>
                </div>

                <div className="h-2 w-full bg-gray-950 rounded-full overflow-hidden p-0.5 border border-gray-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                  <span>{formatCurrency(goal.currentAmount, goal.currency || currency)}</span>
                  <span>Meta: {formatCurrency(goal.targetAmount, goal.currency || currency)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
