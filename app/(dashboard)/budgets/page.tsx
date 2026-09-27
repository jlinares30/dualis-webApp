'use client';

import React, { useState } from 'react';
import { 
  PieChart, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  TrendingUp,
  Target,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useBudgets, useDeleteBudget, CreateBudgetModal, EditBudgetModal, BudgetCategory, BudgetDTO } from '@/features/budgets';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export default function BudgetsPage() {
  const { data: apiBudgets, isLoading } = useBudgets();
  const { mutateAsync: deleteBudgetMut, isPending: isDeleting } = useDeleteBudget();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetDTO | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);

  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const workspaceCurrency = activeWs?.currency || 'PEN';

  const budgets: BudgetCategory[] = apiBudgets
    ? apiBudgets.map((b) => ({
        id: b.id,
        name: b.name,
        category: (b.categoryName?.toLowerCase() as any) || 'food',
        spent: b.spentAmount || 0,
        limit: b.limitAmount || 1000,
        currency: workspaceCurrency || b.currency || 'PEN',
      }))
    : [];

  const totalSpent = budgets.reduce((acc, curr) => acc + curr.spent, 0);
  const totalLimit = budgets.reduce((acc, curr) => acc + curr.limit, 0);
  const overallPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  const getStatus = (spent: number, limit: number) => {
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    if (pct >= 100) {
      return { text: 'Excedido', color: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: AlertTriangle };
    }
    if (pct >= 85) {
      return { text: 'Alerta', color: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertCircle };
    }
    return { text: 'Saludable', color: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1">
              <PieChart className="w-3 h-3" /> Control Presupuestal
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Presupuestos Mensuales
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Establece topes máximos por categoría para mantener el control de tus finanzas.
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Crear Presupuesto
        </button>
      </div>

      {/* Global Summary */}
      <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Consumo Global</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-white">{formatCurrency(totalSpent, workspaceCurrency)}</span>
              <span className="text-sm text-gray-400 font-medium">de {formatCurrency(totalLimit, workspaceCurrency)} límite global</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-300">
            <Target className="w-4 h-4 text-indigo-400" />
            <span>{overallPercentage}% Ejecutado</span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-3 rounded-full bg-gray-800 overflow-hidden p-0.5">
          <div
            className={cn('h-full rounded-full transition-all duration-500', overallPercentage >= 90 ? 'bg-rose-500' : overallPercentage >= 75 ? 'bg-amber-500' : 'bg-emerald-500')}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Budgets List Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-[#0f172a]/60 animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-12 rounded-3xl bg-[#0f172a]/40 border border-gray-800/40 border-dashed space-y-3">
          <PieChart className="w-10 h-10 text-gray-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-gray-300">No tienes presupuestos activos</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Crea topes de gasto por categoría como Alimentación o Servicios para evitar sobrecostos.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-semibold hover:bg-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Crear mi primer presupuesto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {budgets.map((b) => {
            const pct = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0;
            const status = getStatus(b.spent, b.limit);
            const StatusIcon = status.icon;

            const fullBudget = (apiBudgets || []).find((raw) => raw.id === b.id) || {
              id: b.id,
              name: b.name,
              limitAmount: b.limit,
              spentAmount: b.spent,
              currency: workspaceCurrency || b.currency,
            };

            return (
              <div
                key={b.id}
                className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-lg space-y-4 hover:border-gray-700 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">{b.name}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={cn('flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border', status.badge)}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{status.text}</span>
                    </div>

                    {/* Botones de Acción: Editar y Eliminar */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setEditingBudget(fullBudget)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                        title="Editar presupuesto"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingBudgetId(b.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Eliminar presupuesto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-gray-400">Gastado: <strong className="text-white">{formatCurrency(b.spent, b.currency)}</strong></span>
                    <span className="text-gray-400">Límite: <strong className="text-gray-300">{formatCurrency(b.limit, b.currency)}</strong></span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-300', status.color)}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-[11px] text-gray-400">
                  <span>Disponible: {formatCurrency(Math.max(0, b.limit - b.spent), b.currency)}</span>
                  <span className="font-semibold text-indigo-400">{pct}% consumido</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear */}
      <CreateBudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Modal Editar */}
      <EditBudgetModal
        isOpen={Boolean(editingBudget)}
        onClose={() => setEditingBudget(null)}
        budget={editingBudget}
      />

      {/* Modal Confirmar Eliminación */}
      {deletingBudgetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative w-full max-w-sm bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Eliminar Presupuesto</h3>
                <p className="text-xs text-gray-400">¿Estás seguro de continuar?</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Esta acción eliminará el tope de gasto de esta categoría. Tus transacciones pasadas permanecerán intactas.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBudgetId(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await deleteBudgetMut(deletingBudgetId);
                    setDeletingBudgetId(null);
                  } catch (err) {
                    console.error('Error al eliminar presupuesto:', err);
                  }
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
