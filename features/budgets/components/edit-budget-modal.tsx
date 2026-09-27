import React, { useState, useEffect } from 'react';
import { X, PieChart } from 'lucide-react';
import { useUpdateBudget } from '@/hooks';
import { BudgetDTO } from '../types/budgets';

interface EditBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: BudgetDTO | null;
}

export function EditBudgetModal({ isOpen, onClose, budget }: EditBudgetModalProps) {
  const { mutateAsync: updateBudgetMut, isPending } = useUpdateBudget();

  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');

  useEffect(() => {
    if (budget) {
      setName(budget.name || budget.categoryName || '');
      setLimit(budget.limitAmount?.toString() || '');
    }
  }, [budget]);

  if (!isOpen || !budget) return null;

  const currencySymbol = budget.currency === 'USD' ? '$' : budget.currency === 'EUR' ? '€' : 'S/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !limit) return;

    try {
      const parsedLimit = parseFloat(limit);
      if (isNaN(parsedLimit) || parsedLimit <= 0) return;

      await updateBudgetMut({
        id: budget.id,
        data: {
          name: name.trim(),
          amount: parsedLimit,
          limitAmount: parsedLimit,
          currency: budget.currency,
        },
      });

      onClose();
    } catch (err) {
      console.error('Error al editar presupuesto:', err);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Editar Presupuesto</h3>
            <p className="text-xs text-gray-400">Modifica el nombre o tope mensual</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre del Presupuesto</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Mercado y Supermercado"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Límite Máximo ({currencySymbol} {budget.currency})
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="1000"
              step="any"
              min="1"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
