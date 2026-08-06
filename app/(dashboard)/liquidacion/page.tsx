'use client';

import React, { useState } from 'react';
import { 
  HeartHandshake, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Users, 
  DollarSign, 
  Calendar,
  Sparkles,
  ShieldCheck,
  Send
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SettlementHistory {
  id: string;
  date: string;
  amount: number;
  currency: string;
  settledBy: string;
  receivedBy: string;
  note: string;
}

const mockSettlements: SettlementHistory[] = [
  {
    id: 'set-1',
    date: '28 Jul 2026',
    amount: 140,
    currency: 'PEN',
    settledBy: 'Sofía',
    receivedBy: 'Jorge',
    note: 'Saldado cuentas del viaje del fin de semana',
  },
  {
    id: 'set-2',
    date: '15 Jun 2026',
    amount: 210,
    currency: 'PEN',
    settledBy: 'Jorge',
    receivedBy: 'Sofía',
    note: 'Ajuste de gastos mensuales de servicios',
  },
];

export default function SettlementPage() {
  const [partnerBalance] = useState(180); // Positivo: Te deben S/ 180
  const [history, setHistory] = useState<SettlementHistory[]>(mockSettlements);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSettleUp = () => {
    const newEntry: SettlementHistory = {
      id: `set-${Date.now()}`,
      date: 'Hoy',
      amount: partnerBalance,
      currency: 'PEN',
      settledBy: 'Sofía',
      receivedBy: 'Jorge',
      note: 'Liquidación de cuentas realizada',
    };

    setHistory([newEntry, ...history]);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      {/* Header */}
      <div className="pb-4 border-b border-gray-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
              <HeartHandshake className="w-3 h-3" /> Liquidación en Pareja
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Saldar Cuentas
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Calculador automático de balance de gastos compartidos con Sofía.
          </p>
        </div>
      </div>

      {/* Main Settlement Status Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/50 via-gray-900 to-emerald-950/40 border border-emerald-500/30 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Balance Actual Acumulado
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                {formatCurrency(partnerBalance, 'PEN')}
              </h2>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                A favor tuyo
              </span>
            </div>

            <p className="text-xs text-gray-300">
              Sofía debe transferirte esta cantidad para dejar las cuentas en <strong className="text-white">S/ 0.00</strong>.
            </p>
          </div>

          {/* Action button */}
          <div className="w-full md:w-auto">
            <button
              onClick={handleSettleUp}
              disabled={isSuccess}
              className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-gray-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>¡Cuentas Saldadas!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Registrar Pago / Saldar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* History of Settlements */}
      <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Historial de Liquidaciones</h3>
              <p className="text-xs text-gray-400">Cierres de cuenta anteriores completados</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gray-900/60 border border-gray-800/60 gap-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">
                      {item.settledBy} ➔ {item.receivedBy}
                    </span>
                    <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-md font-mono">
                      {item.date}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="font-extrabold text-base text-emerald-400 block">
                  + {formatCurrency(item.amount, item.currency)}
                </span>
                <span className="text-[10px] text-gray-500 font-medium">Liquidado</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
