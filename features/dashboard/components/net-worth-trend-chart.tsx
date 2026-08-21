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
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Landmark, TrendingUp, Wallet, Shield } from 'lucide-react';
import { useAccounts } from '@/hooks';
import { useInvestments } from '@/hooks';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export function NetWorthTrendChart() {
  const { activeWorkspaceId, workspaces } = useWorkspaceStore();
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const currency = activeWs?.currency || 'PEN';
  const { data: accounts = [], isLoading: isLoadingAcc } = useAccounts();
  const { data: investments = [], isLoading: isLoadingInv } = useInvestments();

  const { liquidAssets, investmentAssets, totalNetWorth, chartData } = React.useMemo(() => {
    let liquid = 0;
    let inv = 0;

    accounts.forEach((acc) => {
      if (acc.type === 'INVESTMENT') {
        inv += acc.balance;
      } else {
        liquid += acc.balance;
      }
    });

    investments.forEach((invAcc) => {
      inv += (invAcc.currentValue ?? invAcc.initialCapital ?? 0);
    });

    const netWorth = liquid + inv;

    return {
      liquidAssets: liquid,
      investmentAssets: inv,
      totalNetWorth: netWorth,
      chartData: [
        {
          category: 'Patrimonio',
          Líquido: Math.max(0, liquid),
          Inversiones: Math.max(0, inv),
        },
      ],
    };
  }, [accounts, investments]);

  const isLoading = isLoadingAcc || isLoadingInv;

  return (
    <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-xl space-y-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Landmark className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base text-white">Composición del Patrimonio</h3>
          </div>
          <p className="text-xs text-gray-400">Distribución de liquidez bancaria vs activos de inversión</p>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-gray-400 block">Patrimonio Neto Total</span>
          <span className="text-base font-extrabold text-white">
            {formatCurrency(totalNetWorth, currency)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="py-2 space-y-3">
        {isLoading ? (
          <div className="w-full h-40 rounded-xl bg-gray-900/60 animate-pulse border border-gray-800/50 flex items-center justify-center text-xs text-gray-500">
            Cargando composición de patrimonio...
          </div>
        ) : (
          <>
            {/* Visual Stacked Bar */}
            <div className="h-28 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                  <YAxis type="category" dataKey="category" hide />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl bg-[#090d16] border border-gray-800 p-3 shadow-2xl space-y-1 text-xs">
                            <p className="text-blue-400 font-semibold flex justify-between gap-4">
                              <span>Liquidez Bancaria:</span>
                              <span>{formatCurrency((payload[0]?.value as number) || 0, currency)}</span>
                            </p>
                            <p className="text-purple-400 font-semibold flex justify-between gap-4">
                              <span>Inversiones / Activos:</span>
                              <span>{formatCurrency((payload[1]?.value as number) || 0, currency)}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="Líquido" stackId="a" fill="#3b82f6" radius={[6, 0, 0, 6]} barSize={28} />
                  <Bar dataKey="Inversiones" stackId="a" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Metrics Breakdown Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-semibold">Cuentas Líquidas</span>
                </div>
                <span className="font-bold text-white">{formatCurrency(liquidAssets, currency)}</span>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-semibold">Inversiones</span>
                </div>
                <span className="font-bold text-white">{formatCurrency(investmentAssets, currency)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
