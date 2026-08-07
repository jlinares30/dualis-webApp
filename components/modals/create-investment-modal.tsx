'use client';

import React, { useState } from 'react';
import { X, TrendingUp, Landmark, ShieldCheck } from 'lucide-react';
import { useCreateInvestment } from '@/hooks/useInvestments';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

interface CreateInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateInvestmentModal({ isOpen, onClose }: CreateInvestmentModalProps) {
  const { mutateAsync: createInv, isPending } = useCreateInvestment();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [type, setType] = useState('MUTUAL_FUNDS');
  const [initialCapital, setInitialCapital] = useState('');
  const [currentValue, setCurrentValue] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !initialCapital) return;

    try {
      await createInv({
        name,
        institution: institution || 'Entidad Financiera',
        type,
        initialCapital: parseFloat(initialCapital) || 0,
        currentValue: currentValue ? parseFloat(currentValue) : parseFloat(initialCapital) || 0,
        currency: 'PEN',
        workspaceId: activeWorkspaceId || undefined,
      });
      setName('');
      setInstitution('');
      setInitialCapital('');
      setCurrentValue('');
      onClose();
    } catch (err) {
      console.error('Error al registrar inversión:', err);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Nueva Inversión</h3>
            <p className="text-xs text-gray-400">Registra un fondo, plazo fijo, acciones o cripto</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre de la Inversión</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Fondo Mutuo Conservador BCP"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Plataforma / Banco</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ej. Tyba / Hapi / BCP"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Tipo de Activo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="MUTUAL_FUNDS">Fondos Mutuos</option>
                <option value="FIXED_TERM">Plazo Fijo</option>
                <option value="STOCKS">Acciones / ETFs</option>
                <option value="CRYPTO">Criptomonedas</option>
                <option value="CROWDLENDING">Facturaje / Facturas</option>
                <option value="REAL_ESTATE">Bienes Raíces</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Capital Invertido (S/)</label>
              <input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                placeholder="5000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Valor Valorizado (S/)</label>
              <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="5350"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Registrar Inversión'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
