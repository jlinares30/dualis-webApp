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
  Cell,
} from 'recharts';
import { formatCurrency, filterTransactionsByPeriod } from '@/lib/utils';
import { Users, HeartHandshake, ArrowRightLeft } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { DateFilterOption } from '@/components/dashboard/dashboard-date-filter';

interface PartnerComparisonChartProps {
  period?: DateFilterOption;
}

export function PartnerComparisonChart({ period }: PartnerComparisonChartProps) {
  const { user } = useAuthStore();
  const { partnerName } = useWorkspaceStore();
  const { data: pageData, isLoading } = useTransactions(0, 200);

  const myName = user?.fullName?.split(' ')[0] || 'Tú';
  const partnerLabel = partnerName || 'Tu Pareja';

  const { chartData, myTotal, partnerTotal, settlementText } = React.useMemo(() => {
    if (!pageData?.content || pageData.content.length === 0) {
      return {
        chartData: [
          { name: myName, amount: 0, fill: '#6366f1' },
          { name: partnerLabel, amount: 0, fill: '#ec4899' },
        ],
        myTotal: 0,
        partnerTotal: 0,
        settlementText: 'Sin gastos compartidos en el periodo.',
      };
    }

    const filteredTx = filterTransactionsByPeriod(pageData.content, period);
    let mine = 0;
    let partner = 0;

    filteredTx.forEach((tx) => {
      if (tx.type !== 'EXPENSE') return;

      // Si la transacción fue realizada por el usuario actual o no especifica otro id
      if (!tx.paidByUserId || tx.paidByUserId === user?.email || tx.paidByUserName?.includes(myName)) {
        mine += tx.amount;
      } else {
        partner += tx.amount;
      }
    });

    const diff = Math.abs(mine - partner) / 2;
    let settlement = 'Aportes parejos en el hogar.';
    if (mine > partner) {
      settlement = `${partnerLabel} te compensa ${formatCurrency(diff, 'PEN')}`;
    } else if (partner > mine) {
      settlement = `Le compensas ${formatCurrency(diff, 'PEN')} a ${partnerLabel}`;
    }

    return {
      chartData: [
        { name: myName, amount: mine, fill: '#6366f1' },
        { name: partnerLabel, amount: partner, fill: '#ec4899' },
      ],
      myTotal: mine,
      partnerTotal: partner,
      settlementText: settlement,
    };
  }, [pageData, myName, partnerLabel, user?.email]);

  const hasData = myTotal > 0 || partnerTotal > 0;

  return (
    <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-xl space-y-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400">
              <HeartHandshake className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base text-white">Comparativa de Gastos en Pareja</h3>
          </div>
          <p className="text-xs text-gray-400">Aportes abonados este mes por cada miembro</p>
        </div>

        {hasData && (
          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3" /> {settlementText}
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="py-2">
        {isLoading ? (
          <div className="w-full h-48 rounded-xl bg-gray-900/60 animate-pulse border border-gray-800/50 flex items-center justify-center text-xs text-gray-500">
            Cargando comparativa en pareja...
          </div>
        ) : !hasData ? (
          <div className="w-full h-48 rounded-xl bg-gray-900/40 border border-gray-800/40 border-dashed flex flex-col items-center justify-center p-6 text-center space-y-1">
            <p className="text-xs font-bold text-gray-300">Sin gastos compartidos aun</p>
            <p className="text-[11px] text-gray-500">Al registrar egresos en el Espacio Pareja verás la barra comparativa.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `S/ ${val}`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl bg-[#090d16] border border-gray-800 p-3 shadow-2xl space-y-1 text-xs">
                            <p className="font-bold text-white flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.fill }} />
                              {data.name}
                            </p>
                            <p className="text-gray-200 font-semibold">
                              Pagado: {formatCurrency(data.amount, 'PEN')}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-between">
                <span className="font-semibold">{myName}</span>
                <span className="font-bold text-white">{formatCurrency(myTotal, 'PEN')}</span>
              </div>
              <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300 flex items-center justify-between">
                <span className="font-semibold">{partnerLabel}</span>
                <span className="font-bold text-white">{formatCurrency(partnerTotal, 'PEN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
