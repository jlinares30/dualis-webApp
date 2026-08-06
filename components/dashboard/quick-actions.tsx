'use client';

import React, { useState } from 'react';
import { PlusCircle, Split, ArrowDownLeft, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

interface QuickActionsProps {
  workspace?: 'personal' | 'couple';
}

export function QuickActions({ workspace = 'personal' }: QuickActionsProps) {
  const { hasPartner } = useWorkspaceStore();
  const [activeModal, setActiveModal] = useState<'expense' | 'split' | null>(null);

  const isCouple = hasPartner && workspace === 'couple';

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {/* Agregar Gasto Button */}
        <button
          onClick={() => setActiveModal('expense')}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Agregar Gasto</span>
        </button>

        {/* Crear Transacción Dividida Button (Solo visible en modo pareja cuando está activado) */}
        {isCouple && (
          <button
            onClick={() => setActiveModal('split')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-800/90 hover:bg-gray-700/90 border border-gray-700/80 text-emerald-400 font-medium text-sm transition-all duration-200 active:scale-95 shadow-md cursor-pointer"
          >
            <Split className="w-4 h-4" />
            <span>Dividir Gasto (Split)</span>
          </button>
        )}
      </div>

      {/* Quick Action Interactive Modal Placeholder */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative w-full max-w-md bg-[#0f172a] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl border",
                activeModal === 'expense' 
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              )}>
                {activeModal === 'expense' ? <PlusCircle className="w-6 h-6" /> : <Split className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">
                  {activeModal === 'expense' ? 'Registrar Nuevo Gasto' : 'Crear Gasto Dividido 50/50'}
                </h3>
                <p className="text-xs text-gray-400">
                  {activeModal === 'expense' ? 'Ingresa los detalles de tu compra' : 'Divide el pago entre tú y Sofía'}
                </p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setActiveModal(null); }} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Concepto / Descripción</label>
                <input
                  type="text"
                  placeholder="Ej. Mercado Semanal"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Monto (S/ PEN)</label>
                  <input
                    type="number"
                    placeholder="85"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Categoría</label>
                  <select className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-indigo-500">
                    <option value="food">Alimentación</option>
                    <option value="utilities">Servicios</option>
                    <option value="entertainment">Entretenimiento</option>
                    <option value="transport">Transporte</option>
                  </select>
                </div>
              </div>

              {activeModal === 'split' && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                  <span>División equitativa 50% / 50%</span>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/30"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
