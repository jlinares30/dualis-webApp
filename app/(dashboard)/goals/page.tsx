'use client';

import React, { useState } from 'react';
import { Target, Plus, ShieldCheck, Plane, Home, Car, Laptop, Trash2, ArrowUpRight, CheckCircle, Pencil, X, AlertCircle, Calendar, Wallet, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useGoals, useCreateGoal, useUpdateGoal, useDepositGoal, useDeleteGoal, SavingsGoalDTO } from '@/features/goals';
import { useAccounts } from '@/features/accounts';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';

const COMMON_CURRENCIES = ['PEN', 'USD', 'EUR', 'COP', 'MXN', 'CLP', 'ARS', 'BRL'];

export default function GoalsPage() {
  const { activeWorkspaceId, workspaces, activeWorkspaceType } = useWorkspaceStore();
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const workspaceCurrency = activeWs?.currency || 'PEN';

  const personalWs = workspaces.find((w) => w.type === 'INDIVIDUAL' || (w.type as any) === 'personal');
  const isCoupleWorkspace = activeWorkspaceType === 'couple' || activeWorkspaceType === 'COUPLE';

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

  const convert = useExchangeRateStore((s) => s.convert);

  const { data: goals = [], isLoading } = useGoals();
  const { mutateAsync: createGoalMut, isPending: isCreating } = useCreateGoal();
  const { mutateAsync: updateGoalMut, isPending: isUpdating } = useUpdateGoal();
  const { mutateAsync: depositGoalMut, isPending: isDepositing } = useDepositGoal();
  const { mutateAsync: deleteGoalMut } = useDeleteGoal();

  const [modalOpen, setModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoalDTO | null>(null);

  // Edit Goal State
  const [editingGoal, setEditingGoal] = useState<SavingsGoalDTO | null>(null);
  const [editName, setEditName] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editDeadlineDate, setEditDeadlineDate] = useState('');
  const [editCurrency, setEditCurrency] = useState('PEN');
  const [editCategory, setEditCategory] = useState<'EMERGENCY' | 'TRAVEL' | 'HOUSE' | 'CAR' | 'TECH' | 'OTHER'>('EMERGENCY');
  const [editAccountId, setEditAccountId] = useState('');

  // Form state (Create)
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [createCurrency, setCreateCurrency] = useState(workspaceCurrency);
  const [category, setCategory] = useState<'EMERGENCY' | 'TRAVEL' | 'HOUSE' | 'CAR' | 'TECH' | 'OTHER'>('EMERGENCY');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Local map of goalId to backed accountId
  const [goalAccountMap, setGoalAccountMap] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`dualis_goal_accounts_${activeWorkspaceId}`);
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const saveGoalAccount = (goalId: string, accId: string) => {
    setGoalAccountMap((prev) => {
      const next = { ...prev, [goalId]: accId };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`dualis_goal_accounts_${activeWorkspaceId}`, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
      }
      return next;
    });
  };

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState('');

  // Errors & Deletion state
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoalDTO | null>(null);

  const getCurrencySymbol = (curr: string) => {
    return curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'PEN' ? 'S/' : curr;
  };

  const handleOpenEdit = (goal: SavingsGoalDTO) => {
    setEditingGoal(goal);
    setEditName(goal.name);
    setEditTargetAmount(goal.targetAmount?.toString() || '');
    setEditDeadlineDate(goal.deadlineDate ? goal.deadlineDate.slice(0, 10) : '');
    setEditCurrency(goal.currency || workspaceCurrency);
    setEditCategory((goal.category as any) || 'EMERGENCY');
    setEditAccountId(goalAccountMap[goal.id] || '');
    setFormError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editName || !editTargetAmount) return;

    setFormError(null);
    try {
      await updateGoalMut({
        goalId: editingGoal.id,
        request: {
          name: editName,
          targetAmount: parseFloat(editTargetAmount),
          deadlineDate: editDeadlineDate ? editDeadlineDate : undefined,
          category: editCategory,
          currency: editCurrency,
        },
      });

      if (editAccountId) {
        saveGoalAccount(editingGoal.id, editAccountId);
      } else {
        setGoalAccountMap((prev) => {
          const next = { ...prev };
          delete next[editingGoal.id];
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`dualis_goal_accounts_${activeWorkspaceId}`, JSON.stringify(next));
            } catch (err) {
              console.error(err);
            }
          }
          return next;
        });
      }

      setEditingGoal(null);
    } catch (err: any) {
      console.error('Error al actualizar meta:', err);
      setFormError(err?.message || 'Error al actualizar la meta. Verifica los datos.');
    }
  };

  const handleOpenCreate = () => {
    setCreateCurrency(workspaceCurrency);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadlineDate('');
    setCategory('EMERGENCY');
    setSelectedAccountId('');
    setFormError(null);
    setModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || !activeWorkspaceId) return;

    setFormError(null);
    try {
      const created = await createGoalMut({
        workspaceId: activeWorkspaceId,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        deadlineDate: deadlineDate ? deadlineDate : undefined,
        category,
        currency: createCurrency,
      });

      if (created && created.id && selectedAccountId) {
        saveGoalAccount(created.id, selectedAccountId);
      }

      setModalOpen(false);
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setDeadlineDate('');
      setSelectedAccountId('');
    } catch (err: any) {
      console.error('Error al crear meta:', err);
      setFormError(err?.message || 'Error al crear la meta. Inténtalo nuevamente.');
    }
  };

  const handleOpenDeposit = (goal: SavingsGoalDTO) => {
    setSelectedGoal(goal);
    setDepositAmount('');
    setFormError(null);
    setDepositModalOpen(true);
  };

  const handleDeleteGoal = async () => {
    if (!deletingGoal) return;
    try {
      await deleteGoalMut(deletingGoal.id);
      setDeletingGoal(null);
    } catch (err: any) {
      console.error('Error al eliminar meta:', err);
      alert('Hubo un error al eliminar la meta.');
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !depositAmount) return;

    const parsedDeposit = parseFloat(depositAmount);
    if (isNaN(parsedDeposit) || parsedDeposit <= 0) return;

    setFormError(null);
    try {
      // 1. Abonar a la meta de ahorro directamente
      await depositGoalMut({
        goalId: selectedGoal.id,
        amount: parsedDeposit,
      });

      setDepositModalOpen(false);
      setDepositAmount('');
      setSelectedGoal(null);
    } catch (err: any) {
      console.error('Error al abonar a la meta:', err);
      setFormError(err?.message || 'Error al procesar el abono a la meta.');
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

  const totalSavedInBase = React.useMemo(() => {
    return goals.reduce((acc, g) => {
      const gCurr = g.currency || workspaceCurrency;
      const converted = convert(g.currentAmount || 0, gCurr, workspaceCurrency);
      return acc + converted;
    }, 0);
  }, [goals, workspaceCurrency, convert]);

  const totalTargetInBase = React.useMemo(() => {
    return goals.reduce((acc, g) => {
      const gCurr = g.currency || workspaceCurrency;
      const converted = convert(g.targetAmount || 0, gCurr, workspaceCurrency);
      return acc + converted;
    }, 0);
  }, [goals, workspaceCurrency, convert]);

  const totalAccountsLiquidity = React.useMemo(() => {
    return availableAccounts
      .filter((a) => a.type?.toLowerCase() !== 'credit' && a.type?.toLowerCase() !== 'credit_card')
      .reduce((acc, a) => {
        const aCurr = a.currency || workspaceCurrency;
        return acc + convert(a.balance || 0, aCurr, workspaceCurrency);
      }, 0);
  }, [availableAccounts, workspaceCurrency, convert]);

  const unassignedLiquidity = Math.max(0, totalAccountsLiquidity - totalSavedInBase);
  const globalProgress = totalTargetInBase > 0 ? Math.min(100, Math.round((totalSavedInBase / totalTargetInBase) * 100)) : 0;

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

      {/* Resumen de Asignación Patrimonial y Metas */}
      {goals.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-br from-indigo-950/40 via-[#0f172a] to-blue-950/20 border border-indigo-500/20 p-5 md:p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Ahorro Acumulado en Metas
              </span>
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white font-mono">
                  {formatCurrency(totalSavedInBase, workspaceCurrency)}
                </h2>
                <span className="text-xs text-gray-400">
                  de {formatCurrency(totalTargetInBase, workspaceCurrency)} ({globalProgress}%)
                </span>
              </div>
            </div>

            {/* Tarjetas comparativas de liquidez y disponible */}
            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
              <div className="p-3 rounded-2xl bg-gray-900/80 border border-gray-800 text-left">
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">
                  Liquidez en Cuentas
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  {formatCurrency(totalAccountsLiquidity, workspaceCurrency)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left">
                <span className="block text-[10px] text-emerald-400 uppercase font-semibold">
                  Disponible para Gastar
                </span>
                <span className="text-sm font-bold text-emerald-300 font-mono">
                  {formatCurrency(unassignedLiquidity, workspaceCurrency)}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de progreso global */}
          <div className="space-y-1 pt-1">
            <div className="w-full h-2 rounded-full bg-gray-900 overflow-hidden border border-gray-800/80">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium">
              <span>Progreso Global de Ahorro: {globalProgress}%</span>
              <span>{goals.length} {goals.length === 1 ? 'meta activa' : 'metas activas'}</span>
            </div>
          </div>
        </div>
      )}

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
                        {(() => {
                          const linkedAccId = goalAccountMap[goal.id];
                          const linkedAcc = availableAccounts.find((a) => a.id === linkedAccId);
                          if (!linkedAcc) return null;
                          const isDiffCurrency = linkedAcc.currency.toUpperCase() !== goalCurrency.toUpperCase();
                          const convertedInAcc = isDiffCurrency
                            ? convert(goal.currentAmount || 0, goalCurrency, linkedAcc.currency)
                            : null;

                          return (
                            <div className="flex flex-col gap-0.5 mt-1">
                              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                <Wallet className="w-3 h-3 text-indigo-400 shrink-0" />
                                <span className="truncate max-w-[140px] text-indigo-300 font-semibold">
                                  {linkedAcc.name}
                                </span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-gray-800 text-gray-400 font-mono">
                                  {linkedAcc.currency}
                                </span>
                              </div>
                              {isDiffCurrency && goal.currentAmount > 0 && convertedInAcc !== null && (
                                <span className="text-[9px] text-gray-400/90 pl-4 font-mono">
                                  ≈ {formatCurrency(convertedInAcc, linkedAcc.currency)} en cuenta
                                </span>
                              )}
                            </div>
                          );
                        })()}
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
                        onClick={() => setDeletingGoal(goal)}
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

                    {/* Deadline & Monthly Projection (if deadline exists) */}
                    {(() => {
                      if (!goal.deadlineDate) return null;
                      const deadline = new Date(goal.deadlineDate);
                      const now = new Date();
                      const diffMonths = Math.max(
                        1,
                        (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth())
                      );
                      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
                      const monthlyTarget = remaining > 0 ? remaining / diffMonths : 0;
                      const isPast = deadline < now && remaining > 0;

                      return (
                        <div className="p-2.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[11px] text-gray-300 font-medium">
                              Fecha límite: <strong className="text-white">{deadline.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</strong>
                            </span>
                          </div>
                          {remaining > 0 && !isPast ? (
                            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                              ~{formatCurrency(monthlyTarget, goalCurrency)}/mes
                            </span>
                          ) : isPast ? (
                            <span className="text-[10px] text-amber-400 font-semibold">Vencida</span>
                          ) : null}
                        </div>
                      );
                    })()}

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
                    <div className="w-full flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-emerald-400 inline-flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> ¡Meta Alcanzada!
                      </span>
                      <button
                        onClick={() => handleOpenDeposit(goal)}
                        className="py-1.5 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-xs transition-all flex items-center gap-1 cursor-pointer"
                        title="Seguir acumulando"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" /> Abonar más
                      </button>
                    </div>
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

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

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

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Fecha Límite Deseada (Opcional)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    id="create-deadline-input"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('create-deadline-input') as HTMLInputElement | null;
                      if (input) {
                        try {
                          if (typeof input.showPicker === 'function') {
                            input.showPicker();
                          } else {
                            input.focus();
                          }
                        } catch {
                          input.focus();
                        }
                      }
                    }}
                    className="absolute right-2.5 p-1 rounded-lg text-indigo-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                    title="Abrir calendario"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Permite calcular cuánto deberías ahorrar mensualmente para cumplir tu meta a tiempo.
                </span>
              </div>

              {/* Cuenta Bancaria Vinculada / De Respaldo */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Cuenta Vinculada / Bóveda (Opcional)
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">Sin vincular (Ahorro libre general)</option>
                  {availableAccounts
                    .filter((a) => a.type?.toLowerCase() !== 'credit' && a.type?.toLowerCase() !== 'credit_card')
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} — {formatCurrency(acc.balance, acc.currency)} ({acc.currency})
                      </option>
                    ))}
                </select>

                {(() => {
                  if (!selectedAccountId) return null;
                  const acc = availableAccounts.find((a) => a.id === selectedAccountId);
                  if (!acc) return null;
                  const isDiff = acc.currency.toUpperCase() !== createCurrency.toUpperCase();
                  if (!isDiff) {
                    return (
                      <span className="text-[10px] text-indigo-400 mt-1 block">
                        💡 Tu meta y tu cuenta están en la misma divisa ({acc.currency}). Los montos apartados coincidirán 1 a 1.
                      </span>
                    );
                  }
                  const numCurrent = parseFloat(currentAmount) || 0;
                  const numTarget = parseFloat(targetAmount) || 0;
                  const convertedCurrent = convert(numCurrent, createCurrency, acc.currency);
                  const convertedTarget = convert(numTarget, createCurrency, acc.currency);
                  return (
                    <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Conversión multimoneda automática:</span>
                      </div>
                      <p className="text-[10px] text-amber-200/80 leading-relaxed">
                        Meta en <strong className="text-white font-mono">{createCurrency}</strong> y cuenta en <strong className="text-white font-mono">{acc.currency}</strong>.
                        {numCurrent > 0 && (
                          <span className="block mt-0.5">
                            • Ahorro inicial de {formatCurrency(numCurrent, createCurrency)} apartará aprox.{' '}
                            <strong className="text-amber-300 font-mono">{formatCurrency(convertedCurrent, acc.currency)}</strong> de esta cuenta.
                          </span>
                        )}
                        {numTarget > 0 && (
                          <span className="block">
                            • Meta objetivo de {formatCurrency(numTarget, createCurrency)} equivale a aprox.{' '}
                            <strong className="text-amber-300 font-mono">{formatCurrency(convertedTarget, acc.currency)}</strong>.
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })()}

                {!selectedAccountId && (
                  <span className="text-[10px] text-indigo-400 mt-1 block">
                    💡 Si vinculas esta meta a una cuenta, en la sección de Cuentas verás exactamente cuánto saldo tienes apartado y cuánto libre para gastar.
                  </span>
                )}
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

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Monto Objetivo ({getCurrencySymbol(editCurrency)})
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

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Fecha Límite
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      id="edit-deadline-input"
                      value={editDeadlineDate}
                      onChange={(e) => setEditDeadlineDate(e.target.value)}
                      className="w-full px-3 py-2 pr-10 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('edit-deadline-input') as HTMLInputElement | null;
                        if (input) {
                          try {
                            if (typeof input.showPicker === 'function') {
                              input.showPicker();
                            } else {
                              input.focus();
                            }
                          } catch {
                            input.focus();
                          }
                        }
                      }}
                      className="absolute right-2.5 p-1 rounded-lg text-indigo-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                      title="Abrir calendario"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Cuenta Bancaria Vinculada / De Respaldo */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Cuenta Vinculada / Bóveda (Opcional)
                </label>
                <select
                  value={editAccountId}
                  onChange={(e) => setEditAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">Sin vincular (Ahorro libre general)</option>
                  {availableAccounts
                    .filter((a) => a.type?.toLowerCase() !== 'credit' && a.type?.toLowerCase() !== 'credit_card')
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} — {formatCurrency(acc.balance, acc.currency)} ({acc.currency})
                      </option>
                    ))}
                </select>

                {(() => {
                  if (!editAccountId) return null;
                  const acc = availableAccounts.find((a) => a.id === editAccountId);
                  if (!acc) return null;
                  const isDiff = acc.currency.toUpperCase() !== editCurrency.toUpperCase();
                  if (!isDiff) {
                    return (
                      <span className="text-[10px] text-indigo-400 mt-1 block">
                        💡 Tu meta y tu cuenta están en la misma divisa ({acc.currency}). Los montos apartados coincidirán 1 a 1.
                      </span>
                    );
                  }
                  const numTarget = parseFloat(editTargetAmount) || 0;
                  const currentSaved = editingGoal?.currentAmount || 0;
                  const convertedCurrent = convert(currentSaved, editCurrency, acc.currency);
                  const convertedTarget = convert(numTarget, editCurrency, acc.currency);
                  return (
                    <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Conversión multimoneda automática:</span>
                      </div>
                      <p className="text-[10px] text-amber-200/80 leading-relaxed">
                        Meta en <strong className="text-white font-mono">{editCurrency}</strong> y cuenta en <strong className="text-white font-mono">{acc.currency}</strong>.
                        {currentSaved > 0 && (
                          <span className="block mt-0.5">
                            • Tu ahorro actual de {formatCurrency(currentSaved, editCurrency)} apartará aprox.{' '}
                            <strong className="text-amber-300 font-mono">{formatCurrency(convertedCurrent, acc.currency)}</strong> de esta cuenta.
                          </span>
                        )}
                        {numTarget > 0 && (
                          <span className="block">
                            • Meta objetivo de {formatCurrency(numTarget, editCurrency)} equivale a aprox.{' '}
                            <strong className="text-amber-300 font-mono">{formatCurrency(convertedTarget, acc.currency)}</strong>.
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })()}

                {!editAccountId && (
                  <span className="text-[10px] text-indigo-400 mt-1 block">
                    💡 Vincula esta meta a la cuenta de donde apartas tus ahorros para reflejarlo en tu saldo disponible.
                  </span>
                )}
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

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

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

                {(() => {
                  const linkedAccId = goalAccountMap[selectedGoal.id];
                  const linkedAcc = availableAccounts.find((a) => a.id === linkedAccId);
                  if (!linkedAcc) return null;
                  const gCurr = selectedGoal.currency || workspaceCurrency;
                  if (linkedAcc.currency.toUpperCase() === gCurr.toUpperCase()) return null;

                  const parsedVal = parseFloat(depositAmount) || 0;
                  const convertedAcc = convert(parsedVal, gCurr, linkedAcc.currency);

                  return (
                    <div className="mt-2 p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300">
                      <div className="flex items-center justify-between">
                        <span>Cuenta vinculada: <strong className="text-white">{linkedAcc.name}</strong></span>
                        <span className="font-mono text-indigo-200">
                          {parsedVal > 0 ? `≈ ${formatCurrency(convertedAcc, linkedAcc.currency)}` : `(${linkedAcc.currency})`}
                        </span>
                      </div>
                      <span className="text-[10px] text-indigo-400/80 block mt-0.5">
                        Al abonar {getCurrencySymbol(gCurr)} {depositAmount || '0'} a tu meta, se apartarán aprox. {formatCurrency(convertedAcc, linkedAcc.currency)} de tu saldo disponible en el banco.
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Este abono se suma directamente a tu meta acumulada como ahorro, sin computarse como gasto operativo para proteger tus métricas y presupuestos mensuales.
                </span>
              </div>

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

      {/* Modal Confirmar Eliminación de Meta */}
      {deletingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0f172a] border border-gray-800 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-white">¿Eliminar esta meta de ahorro?</h3>
              <p className="text-xs text-gray-400">
                Estás por eliminar <strong className="text-white">"{deletingGoal.name}"</strong> con{' '}
                <strong className="text-indigo-400 font-mono">
                  {formatCurrency(deletingGoal.currentAmount, deletingGoal.currency || workspaceCurrency)}
                </strong>{' '}
                acumulados. Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingGoal(null)}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteGoal}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
