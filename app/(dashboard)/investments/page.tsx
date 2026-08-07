'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  DollarSign, 
  Sparkles, 
  PieChart, 
  ShieldCheck, 
  Layers, 
  Coins 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useInvestments } from '@/hooks/useInvestments';
import { CreateInvestmentModal } from '@/components/modals/create-investment-modal';

export default function InvestmentsPage() {
  const { data: apiInvestments, isLoading } = useInvestments();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const investments = apiInvestments || [];

  const totalCapital = investments.reduce((acc, curr) => acc + (curr.initialCapital || 0), 0);
  const totalValue = investments.reduce((acc, curr) => acc + (curr.currentValue || curr.initialCapital || 0), 0);
  const totalReturns = totalValue - totalCapital;
  const overallRoi = totalCapital > 0 ? (totalReturns / totalCapital) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Portafolio de Inversiones
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Gestión de Inversiones
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Monitorea el crecimiento de tus activos, fondos mutuos, acciones y criptomonedas.
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Registrar Inversión
        </button>
      </div>

      {/* Global Portfolio Summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/40 via-gray-900 to-indigo-950/30 border border-emerald-500/20 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Valor Total del Portafolio
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-1">
              {formatCurrency(totalValue, 'PEN')}
            </h2>
            <div className="flex items-center gap-3 mt-2 text-xs font-medium">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${totalReturns >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                <ArrowUpRight className="w-3.5 h-3.5" />
                {totalReturns >= 0 ? '+' : ''}{formatCurrency(totalReturns, 'PEN')} ({overallRoi.toFixed(2)}% ROI)
              </span>
              <span className="text-gray-400">Capital aportado: {formatCurrency(totalCapital, 'PEN')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-2xl bg-gray-900/80 border border-gray-800 text-center">
              <span className="block text-[10px] text-gray-400 uppercase font-semibold">Activos Registrados</span>
              <span className="text-sm font-bold text-white">{investments.length}</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-gray-900/80 border border-gray-800 text-center">
              <span className="block text-[10px] text-gray-400 uppercase font-semibold">Rendimiento Promedio</span>
              <span className={`text-sm font-bold ${overallRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {overallRoi >= 0 ? '+' : ''}{overallRoi.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Investment Assets */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-[#0f172a]/60 animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : investments.length === 0 ? (
        <div className="text-center py-12 rounded-3xl bg-[#0f172a]/40 border border-gray-800/40 border-dashed space-y-3">
          <TrendingUp className="w-10 h-10 text-gray-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-gray-300">No tienes inversiones registradas aún</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Registra tu primer plazo fijo, fondo mutuo o portafolio de criptos para medir tus ganancias.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Registrar mi primera inversión
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {investments.map((inv) => {
            const capital = inv.initialCapital || 0;
            const current = inv.currentValue || capital;
            const gain = current - capital;
            const roi = capital > 0 ? (gain / capital) * 100 : 0;

            return (
              <div
                key={inv.id}
                className="relative overflow-hidden rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-lg hover:border-gray-700 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-md">
                    <TrendingUp className="w-5 h-5" />
                  </div>

                  <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                    {inv.type}
                  </span>
                </div>

                <div className="space-y-1 mb-4">
                  <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors">
                    {inv.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {inv.institution || 'Entidad Financiera'}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-800/80 space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-gray-400">Valor Actual</span>
                    <span className="font-bold text-base text-white">
                      {formatCurrency(current, inv.currency || 'PEN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500">Capital: {formatCurrency(capital, inv.currency || 'PEN')}</span>
                    <span className={`font-semibold ${gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {gain >= 0 ? '+' : ''}{gain.toFixed(2)} ({roi.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <CreateInvestmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
