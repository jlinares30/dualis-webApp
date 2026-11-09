'use client';

import React from 'react';
import { History, X, CheckCircle2, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSubscriptionPayments } from '../hooks/useSubscriptions';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface SubscriptionHistoryModalProps {
  subscription: { id: string; name: string } | null;
  onClose: () => void;
}

export function SubscriptionHistoryModal({ subscription, onClose }: SubscriptionHistoryModalProps) {
  const { data: payments = [], isLoading, isError } = useSubscriptionPayments(subscription?.id);

  if (!subscription) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Historial de pagos</h3>
              <p className="text-xs text-gray-400">{subscription.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 cursor-pointer"
            aria-label="Cerrar historial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="h-24 rounded-2xl bg-gray-900/60 animate-pulse" />
        ) : isError ? (
          <p className="text-xs text-rose-400">No se pudo cargar el historial de pagos.</p>
        ) : payments.length === 0 ? (
          <p className="text-xs text-gray-400">Todavía no hay pagos registrados para este servicio.</p>
        ) : (
          <ul className="space-y-2">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-950/60 border border-gray-800/80"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-white">
                      {MONTHS[p.periodMonth - 1]} {p.periodYear}
                    </span>
                    <span className="block text-[11px] text-gray-500">
                      Pagado el {new Date(p.paidAt).toLocaleDateString('es-PE')}
                      {p.paidByEmail ? ` · ${p.paidByEmail}` : ''}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-extrabold text-white">{formatCurrency(p.amount, p.currency)}</span>
                  {p.transactionId && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                      <Receipt className="w-3 h-3" /> Debitado de cuenta
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
