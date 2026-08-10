'use client';

import React, { useState } from 'react';
import { Target, Plus, ShieldCheck, Plane, Home, Car, Laptop, Trash2, ArrowUpRight, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useGoals, useCreateGoal, useDepositGoal, useDeleteGoal } from '@/hooks/useGoals';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export default function GoalsPage() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const { data: goals = [], isLoading } = useGoals();
  const { mutateAsync: createGoalMut, isPending: isCreating } = useCreateGoal();
  const { mutateAsync: depositGoalMut } = useDepositGoal();
  const { mutateAsync: deleteGoalMut } = useDeleteGoal();

  const [modalOpen, setModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [category, setCategory] = useState<'EMERGENCY' | 'TRAVEL' | 'HOUSE' | 'CAR' | 'TECH' | 'OTHER'>('EMERGENCY');
  const [depositAmount, setDepositAmount] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !activeWorkspaceId) return;

    try {
      await createGoalMut({
        workspaceId: activeWorkspaceId,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        category,
        currency: 'PEN',
      });
      setModalOpen(false);
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
    } catch (err) {
      console.error('Error al crear meta:', err);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !depositAmount) return;

    try {
      await depositGoalMut({
        goalId: selectedGoalId,
        amount: parseFloat(depositAmount),
      });
      setDepositModalOpen(false);
      setDepositAmount('');
      setSelectedGoalId(null);
    } catch (err) {
      console.error('Error al abonar a la meta:', err);
    }
  };

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'TRAVEL': return Plane;
      case 'HOUSE': return Home;
      case 'CAR': return Car;
      case 'TECH': return Laptop;
      case 'EMERGENCY': return ShieldCheck;
      default: return Target;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1">
              <Target className="w-3 h-3" /> Planificación de Vida
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Metas de Ahorro y Objetivos
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Define tus metas financieras, haz seguimiento de tu progreso y proyecta tu independencia.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Crear Nueva Meta
        </button>
      </div>

      {/* Grid of Goals */}
      {isLoading ? (
        <div className="h-64 rounded-2xl bg-gray-900/60 animate-pulse border border-gray-800/50 flex items-center justify-center text-xs text-gray-500">
          Cargando metas financieras...
        </div>
      ) : goals.length === 0 ? (
        <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-white">No tienes metas configuradas</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Crea tu primera meta de ahorro (Fondo de Emergencia, Viajes, Auto, Casa) para visualizar tu barra de progreso e inspirar tus hábitos financieros.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" /> Crear Mi Primera Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const Icon = getCategoryIcon(goal.category);
            const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
            const isCompleted = pct >= 100;

            return (
              <div
                key={goal.id}
                className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white truncate max-w-[160px]">{goal.name}</h3>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {goal.category === 'EMERGENCY' ? 'Fondo de Emergencia' : goal.category === 'TRAVEL' ? 'Viajes' : goal.category === 'HOUSE' ? 'Vivienda' : goal.category === 'CAR' ? 'Vehículo' : goal.category === 'TECH' ? 'Tecnología' : 'Otro Objetivo'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteGoalMut(goal.id)}
                      className="p-1.5 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Eliminar meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Info */}
                  <div className="space-y-2 py-2">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-2xl font-extrabold text-white">{pct}%</span>
                      <span className="text-gray-400 font-medium">
                        {formatCurrency(goal.currentAmount, goal.currency || 'PEN')} / {formatCurrency(goal.targetAmount, goal.currency || 'PEN')}
                      </span>
                    </div>

                    <div className="h-3 w-full bg-gray-950 rounded-full overflow-hidden p-0.5 border border-gray-800">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-800/60 flex items-center justify-between gap-2">
                  {isCompleted ? (
                    <span className="text-xs font-semibold text-emerald-400 inline-flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> ¡Meta Alcanzada!
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedGoalId(goal.id);
                        setDepositModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Abonar Dinero
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear Meta */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0f172a] border border-gray-800 p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-white">Nueva Meta de Ahorro</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre del Objetivo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Fondo de Emergencia de 6 Meses"
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Monto Objetivo (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Ahorro Inicial (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Categoría del Objetivo</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="EMERGENCY">🛡️ Fondo de Emergencia</option>
                  <option value="TRAVEL">✈️ Viajes & Vacaciones</option>
                  <option value="HOUSE">🏠 Vivienda / Inmueble</option>
                  <option value="CAR">🚗 Vehículo / Auto</option>
                  <option value="TECH">💻 Tecnología / Equipamiento</option>
                  <option value="OTHER">🎯 Otro Objetivo</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? 'Guardando...' : 'Crear Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Abonar a Meta */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0f172a] border border-gray-800 p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white">Abonar Dinero a Meta</h3>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Monto a Abonar (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Ej. 250.00"
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Abonar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
