'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, CheckCircle2, Clock, Plus, Zap, Tv, Home, Shield, BookOpen, Layers } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSubscriptions, useToggleSubscriptionPaid } from '@/hooks/useSubscriptions';

export function UpcomingBillsWidget() {
  const { data: subs = [], isLoading } = useSubscriptions();
  const { mutateAsync: togglePaidMut } = useToggleSubscriptionPaid();

  const getSubIcon = (cat?: string) => {
    switch (cat) {
      case 'HOUSING': return Home;
      case 'UTILITIES': return Zap;
      case 'SUBSCRIPTION': return Tv;
      case 'HEALTH': return Shield;
      case 'EDUCATION': return BookOpen;
      default: return Layers;
    }
  };

  const currentDay = new Date().getDate();

  return (
    <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Calendar className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-bold text-base text-white">Próximos Vencimientos</h3>
            <p className="text-xs text-gray-400">Pagos fijos del mes</p>
          </div>
        </div>

        <Link
          href="/subscriptions"
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 transition-colors"
        >
          Gestionar <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="h-28 rounded-xl bg-gray-900/60 animate-pulse border border-gray-800/50 flex items-center justify-center text-xs text-gray-500">
            Cargando vencimientos...
          </div>
        ) : subs.length === 0 ? (
          <div className="rounded-xl bg-gray-900/40 border border-gray-800/40 border-dashed p-4 text-center space-y-2">
            <p className="text-xs text-gray-400">Sin pagos fijos o suscripciones programadas.</p>
            <Link
              href="/subscriptions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Pago Fijo
            </Link>
          </div>
        ) : (
          subs.slice(0, 4).map((sub) => {
            const Icon = getSubIcon(sub.category);
            const isPastDue = !sub.isPaidThisMonth && sub.dueDay < currentDay;

            return (
              <div
                key={sub.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-900/60 border border-gray-800/60 hover:bg-gray-800/50 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePaidMut(sub.id)}
                    className={`p-1 rounded-lg border transition-all cursor-pointer ${
                      sub.isPaidThisMonth
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                    }`}
                    title={sub.isPaidThisMonth ? 'Marcado como pagado' : 'Marcar como pagado'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <div>
                    <span className={`block font-bold text-white ${sub.isPaidThisMonth ? 'line-through opacity-60' : ''}`}>
                      {sub.name}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Vence el día {sub.dueDay}
                      {isPastDue && <span className="text-rose-400 font-bold ml-1">(Vencido)</span>}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-white">{formatCurrency(sub.amount, sub.currency || 'PEN')}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
