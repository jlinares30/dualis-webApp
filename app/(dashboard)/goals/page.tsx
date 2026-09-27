'use client';

import React, { useState } from 'react';
import { Target, Plus, ShieldCheck, Plane, Home, Car, Laptop, Trash2, ArrowUpRight, CheckCircle, Pencil, X, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useGoals, useCreateGoal, useUpdateGoal, useDepositGoal, useDeleteGoal, SavingsGoalDTO } from '@/features/goals';
import { useAccounts } from '@/features/accounts';
import { useCreateTransaction } from '@/features/transactions';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';

const COMMON_CURRENCIES = ['PEN', 'USD', 'EUR', 'COP', 'MXN', 'CLP', 'ARS', 'BRL'];

export default function GoalsPage() {
  const { activeWorkspaceId, workspaces, activeWorkspaceType } = useWorkspaceStore();
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const workspaceCurrency = activeWs?.currency || 'PEN';

  const personalWs = workspaces.find((w) => w.type === 'INDIVIDUAL' || (w.type as any) === 'personal');
  const isCoupleWorkspace = activeWorkspaceType === 'couple' || activeWorkspaceType === 'COUPLE';

  // Accounts
  const { data: accountsData = [] } = useAccounts();
  const { data: personalAccountsData = [] } = useAccounts(
    isCoupleWorkspace && personalWs?.id ? personalWs.id : undefined
  );

  const availableAccounts = React.useMemo(() => {
    if (!isCoupleWorkspace) return accountsData || [];
    const seen = new Set<string>();
    const combined: typeof accountsData = [];
    [...(personalAccountsData || []), ...(accountsData || [])].forEach((acc) => {
      if (!seen.has(acc.id)) {
        seen.add(acc.id);
        combined.push(acc);
      }
    });
    return combined;
  }, [isCoupleWorkspace, accountsData, personalAccountsData]);

  const { convert } = useExchangeRateStore();

  const { data: goals = [], isLoading } = useGoals();
  const { mutateAsync: createGoalMut, isPending: isCreating } = useCreateGoal();
  const { mutateAsync: updateGoalMut, isPending: isUpdating } = useUpdateGoal();
  const { mutateAsync: depositGoalMut, isPending: isDepositing } = useDepositGoal();
  const { mutateAsync: createTxMut } = useCreateTransaction();
  const { mutateAsync: deleteGoalMut } = useDeleteGoal();

  const [modalOpen, setModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoalDTO | null>(null);

  // Edit Goal State
  const [editingGoal, setEditingGoal] = useState<SavingsGoalDTO | null>(null);
  const [editName, setEditName] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editCurrency, setEditCurrency] = useState('PEN');
  const [editCategory, setEditCategory] = useState<'EMERGENCY' | 'TRAVEL' | 'HOUSE' | 'CAR' | 'TECH' | 'OTHER'>('EMERGENCY');

  // Form state (Create)
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [createCurrency, setCreateCurrency] = useState(workspaceCurrency);
  const [category, setCategory] = useState<'EMERGENCY' | 'TRAVEL' | 'HOUSE' | 'CAR' | 'TECH' | 'OTHER'>('EMERGENCY');

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [deductFromAccount, setDeductFromAccount] = useState(true);

  const getCurrencySymbol = (curr: string) => {
    return curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'PEN' ? 'S/' : curr;
  };

  const handleOpenEdit = (goal: SavingsGoalDTO) => {
    setEditingGoal(goal);
    setEditName(goal.name);
    setEditTargetAmount(goal.targetAmount?.toString() || '');
    setEditCurrency(goal.currency || workspaceCurrency);
    setEditCategory((goal.category as any) || 'EMERGENCY');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editName || !editTargetAmount) return;

    try {
      await updateGoalMut({
        goalId: editingGoal.id,
        request: {
          name: editName,
          targetAmount: parseFloat(editTargetAmount),
          category: editCategory,
          currency: editCurrency,
        },
      });
      setEditingGoal(null);
    } catch (err) {
      console.error('Error al actualizar meta:', err);
    }
  };

  const handleOpenCreate = () => {
    setCreateCurrency(workspaceCurrency);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setCategory('EMERGENCY');
    setModalOpen(true);
  };

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
        currency: createCurrency,
      });
      setModalOpen(false);
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
    } catch (err) {
      console.error('Error al crear meta:', err);
    }
  };

  const handleOpenDeposit = (goal: SavingsGoalDTO) => {
    setSelectedGoal(goal);
    setDepositAmount('');
    // Seleccionar por defecto la cuenta que coincida con la moneda de la meta, o la primera disponible
    const matchingAcc = availableAccounts.find((a) => a.currency === goal.currency);
    setSelectedAccountId(matchingAcc ? matchingAcc.id : availableAccounts[0]?.id || '');
    setDeductFromAccount(availableAccounts.length > 0);
    setDepositModalOpen(true);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !depositAmount) return;

    const parsedDeposit = parseFloat(depositAmount);
    if (isNaN(parsedDeposit) || parsedDeposit <= 0) return;

    const goalCurrency = selectedGoal.currency || workspaceCurrency;
    const originAccount = availableAccounts.find((a) => a.id === selectedAccountId);

    try {
      // 1. Abonar a la meta de ahorro
      await depositGoalMut({
        goalId: selectedGoal.id,
        amount: parsedDeposit,
      });

      // 2. Si el usuario eligió descontar de una cuenta bancaria, registrar transacción de gasto (Ahorro)
      if (deductFromAccount && originAccount) {
        // Si la moneda de la cuenta es distinta a la de la meta, convertir el monto a descontar de la cuenta
        let amountToDeduct = parsedDeposit;
        if (originAccount.currency && originAccount.currency !== goalCurrency) {
          amountToDeduct = parseFloat(convert(parsedDeposit, goalCurrency, originAccount.currency).toFixed(2));
        }

        try {
          await createTxMut({
            workspaceId: originAccount.workspaceId || activeWorkspaceId!,
            accountId: originAccount.id,
            amount: amountToDeduct,
            currency: originAccount.currency,
            type: 'EXPENSE',
            categoryNature: 'SAVINGS',
            description: `Aporte a meta de ahorro: ${selectedGoal.name}`,
            transactionDate: new Date().toISOString(),
          });
        } catch (txErr) {
          console.error('Error al registrar transacción de deducción de cuenta:', txErr);
        }
      }

      setDepositModalOpen(false);
      setDepositAmount('');
      setSelectedGoal(null);
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
          onClick={handleOpenCreate}
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
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" /> Crear Mi Primera Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const Icon = getCategoryIcon(goal.category);
            const goalCurrency = goal.currency || workspaceCurrency;
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
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-400 font-medium">
                            {goal.category === 'EMERGENCY' ? 'Fondo de Emergencia' : goal.category === 'TRAVEL' ? 'Viajes' : goal.category === 'HOUSE' ? 'Vivienda' : goal.category === 'CAR' ? 'Vehículo' : goal.category === 'TECH' ? 'Tecnología' : 'Otro Objetivo'}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold font-mono">
                            {goalCurrency}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="p-1.5 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                        title="Editar meta"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteGoalMut(goal.id)}
                        className="p-1.5 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Eliminar meta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Info & Metrics */}
                  <div className="space-y-3 py-1">
                    {/* Tarjetas de Métricas: Ahorrado vs Objetivo */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-gray-950/60 border border-gray-800/60">
                      <div>
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Ahorrado
                        </span>
                        <span className="text-base font-extrabold text-white font-mono tracking-tight">
                          {formatCurrency(goal.currentAmount, goalCurrency)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Meta Objetivo
                        </span>
                        <span className="text-base font-extrabold text-indigo-300 font-mono tracking-tight">
                          {formatCurrency(goal.targetAmount, goalCurrency)}
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progreso y Porcentaje */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-medium text-gray-400">
                          {isCompleted ? (
                            <span className="text-emerald-400 font-semibold">¡Completado!</span>
                          ) : (
                            <>
                              Faltan{' '}
                              <strong className="text-gray-300 font-semibold font-mono">
                                {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount), goalCurrency)}
                              </strong>
                            </>
                          )}
                        </span>
                        <span className="text-sm font-extrabold text-white font-mono bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20 text-indigo-300">
                          {pct}%
                        </span>
                      </div>

                      <div className="h-3 w-full bg-gray-950 rounded-full overflow-hidden p-0.5 border border-gray-800 shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isCompleted
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
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
                      onClick={() => handleOpenDeposit(goal)}
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
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Nueva Meta de Ahorro</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Moneda del Objetivo</label>
                  <select
                    value={createCurrency}
                    onChange={(e) => setCreateCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white font-semibold outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {COMMON_CURRENCIES.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr} ({getCurrencySymbol(curr)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="EMERGENCY">🛡️ Fondo Emergencia</option>
                    <option value="TRAVEL">✈️ Viajes</option>
                    <option value="HOUSE">🏠 Vivienda</option>
                    <option value="CAR">🚗 Vehículo</option>
                    <option value="TECH">💻 Tecnología</option>
                    <option value="OTHER">🎯 Otro Objetivo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Monto Objetivo ({getCurrencySymbol(createCurrency)})
                  </label>
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
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Ahorro Inicial ({getCurrencySymbol(createCurrency)})
                  </label>
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

      {/* Modal Editar Meta */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0f172a] border border-gray-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Editar Meta de Ahorro</h3>
              <button
                type="button"
                onClick={() => setEditingGoal(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre del Objetivo</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Moneda</label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white font-semibold outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {COMMON_CURRENCIES.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr} ({getCurrencySymbol(curr)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Categoría</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="EMERGENCY">🛡️ Fondo Emergencia</option>
                    <option value="TRAVEL">✈️ Viajes</option>
                    <option value="HOUSE">🏠 Vivienda</option>
                    <option value="CAR">🚗 Vehículo</option>
                    <option value="TECH">💻 Tecnología</option>
                    <option value="OTHER">🎯 Otro Objetivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Monto Objetivo ({getCurrencySymbol(editCurrency)} {editCurrency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editTargetAmount}
                  onChange={(e) => setEditTargetAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Abonar a Meta */}
      {depositModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0f172a] border border-gray-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Abonar Dinero a Meta</h3>
                <p className="text-xs text-gray-400">
                  {selectedGoal.name} • <span className="font-mono text-indigo-400">{selectedGoal.currency || workspaceCurrency}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDepositModalOpen(false);
                  setSelectedGoal(null);
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Monto a Abonar ({getCurrencySymbol(selectedGoal.currency || workspaceCurrency)} {selectedGoal.currency || workspaceCurrency})
                </label>
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

              {/* Opción de descontar de cuenta bancaria */}
              {availableAccounts.length > 0 && (
                <div className="p-3 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deductFromAccount}
                      onChange={(e) => setDeductFromAccount(e.target.checked)}
                      className="rounded border-gray-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-gray-300 font-medium">
                      Descontar de una de mis cuentas bancarias
                    </span>
                  </label>

                  {deductFromAccount && (
                    <div className="space-y-2 pt-1 border-t border-gray-800/60">
                      <label className="block text-[11px] font-semibold text-gray-400">
                        Cuenta de Origen
                      </label>
                      <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        {availableAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} — {formatCurrency(acc.balance, acc.currency)} ({acc.currency})
                          </option>
                        ))}
                      </select>

                      {/* Nota de conversión si las monedas difieren */}
                      {(() => {
                        const originAcc = availableAccounts.find((a) => a.id === selectedAccountId);
                        const goalCurr = selectedGoal.currency || workspaceCurrency;
                        const depNum = parseFloat(depositAmount) || 0;
                        if (originAcc && originAcc.currency && originAcc.currency !== goalCurr && depNum > 0) {
                          const convertedAmount = convert(depNum, goalCurr, originAcc.currency);
                          return (
                            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-start gap-1.5 mt-1">
                              <AlertCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                              <span>
                                Se debitará aproximadamente <strong>{formatCurrency(convertedAmount, originAcc.currency)}</strong> de tu cuenta <strong>{originAcc.name}</strong> al tipo de cambio actual.
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDepositModalOpen(false);
                    setSelectedGoal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDepositing}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isDepositing ? 'Procesando...' : 'Abonar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
