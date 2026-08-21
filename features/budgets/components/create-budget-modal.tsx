import React, { useState, useEffect } from 'react';
import { X, PieChart, AlertCircle } from 'lucide-react';
import { useCreateBudget } from '@/hooks';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useCategories, useCreateCategory } from '@/hooks';

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBudgetModal({ isOpen, onClose }: CreateBudgetModalProps) {
  const { mutateAsync: createBudget, isPending } = useCreateBudget();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  const { data: categoriesData } = useCategories('EXPENSE');
  const { mutateAsync: createCategory } = useCreateCategory();

  const [name, setName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [limit, setLimit] = useState('');

  useEffect(() => {
    if (categoriesData && categoriesData.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categoriesData[0].id);
    }
  }, [categoriesData, selectedCategoryId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !limit || !activeWorkspaceId) return;

    try {
      let targetCategoryId = selectedCategoryId;

      // Si no existe ninguna categoría aún, autocreamos una categoría para evitar el duplicado de categoryId=null
      if (!targetCategoryId && activeWorkspaceId) {
        try {
          const newCat = await createCategory({
            workspaceId: activeWorkspaceId,
            name: name,
            type: 'EXPENSE',
            categoryNature: 'ESSENTIAL',
          });
          targetCategoryId = newCat.id;
        } catch (catErr) {
          console.error('Error al autocrear categoría para presupuesto:', catErr);
        }
      }

      await createBudget({
        workspaceId: activeWorkspaceId,
        name,
        categoryId: targetCategoryId || undefined,
        amount: parseFloat(limit) || 0,
        limitAmount: parseFloat(limit) || 0,
        currency: 'PEN',
      });
      setName('');
      setLimit('');
      onClose();
    } catch (err) {
      console.error('Error al crear presupuesto:', err);
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
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Nuevo Presupuesto</h3>
            <p className="text-xs text-gray-400">Establece un tope tope máximo de gasto mensual</p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Categoría</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
              >
                {categoriesData && categoriesData.length > 0 ? (
                  categoriesData.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <option value="">Categoría General (Autocrear)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Límite Máximo (S/ PEN)</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="1000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                required
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
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Crear Presupuesto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
