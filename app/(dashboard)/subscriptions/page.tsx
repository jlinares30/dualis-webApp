'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, Clock, Trash2, Home, Zap, Tv, Shield, BookOpen, Layers, TrendingUp, Wallet, Check, Sparkles, Lock, UserCheck, Eye, EyeOff } from 'lucide-react';
import { formatCurrency, capitalize } from '@/lib/utils';
import { useSubscriptions, useCreateSubscription, useToggleSubscriptionPaid, useDeleteSubscription } from '@/features/subscriptions';
import { useSplitRules, useCreateSplitRule, useUpdateSplitRule } from '@/features/transactions';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const {
    activeWorkspaceId,
    workspaces,
    hasPartner,
    partnerName,
    userMonthlyIncome = 0,
    partnerMonthlyIncome = 0,
    setMonthlyIncomes
  } = useWorkspaceStore();
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const currency = activeWs?.currency || 'PEN';

  const { data: subs = [], isLoading } = useSubscriptions();
  const { mutateAsync: createSubMut, isPending: isCreating } = useCreateSubscription();
  const { mutateAsync: togglePaidMut } = useToggleSubscriptionPaid();
  const { mutateAsync: deleteSubMut } = useDeleteSubscription();

  const { data: splitRules = [] } = useSplitRules();
  const { mutateAsync: createSplitRuleMut } = useCreateSplitRule();
  const { mutateAsync: updateSplitRuleMut } = useUpdateSplitRule();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [category, setCategory] = useState<'HOUSING' | 'UTILITIES' | 'SUBSCRIPTION' | 'HEALTH' | 'EDUCATION' | 'OTHER'>('SUBSCRIPTION');

  // Ingresos recurrentes / fijos
  const [myIncomeInput, setMyIncomeInput] = useState<string>(userMonthlyIncome > 0 ? String(userMonthlyIncome) : '');
  const [partnerIncomeInput, setPartnerIncomeInput] = useState<string>(partnerMonthlyIncome > 0 ? String(partnerMonthlyIncome) : '');
  const [incomeSaved, setIncomeSaved] = useState(false);
  const [isSavingIncome, setIsSavingIncome] = useState(false);
  const [hasInitializedInputs, setHasInitializedInputs] = useState(false);

  // Opciones de Privacidad
  const [hideIncomeFromPartner, setHideIncomeFromPartner] = useState(false);
  const [partnerHidesFromMe, setPartnerHidesFromMe] = useState(false);
  const [showPartnerIncome, setShowPartnerIncome] = useState(false);

  // Determinar si el usuario actual es el OWNER (Partner A) o el PARTNER (Partner B) del workspace
  const isOwner = Boolean(
    activeWs?.members?.some((m) => m.role === 'OWNER' && (m.userEmail === user?.email || m.userId === user?.id)) ||
    activeWs?.members?.length === 0 ||
    !activeWs?.members ||
    (activeWs?.members?.[0]?.userEmail === user?.email)
  );

  // Obtener el nombre de la pareja de los miembros del espacio compartido
  const partnerMember = activeWs?.members?.find((m) => m.userEmail !== user?.email && m.userId !== user?.id);
  const rawPartnerName =
    partnerMember?.userName ||
    (partnerMember?.userEmail ? partnerMember.userEmail.split('@')[0] : null) ||
    (partnerName && partnerName.toLowerCase() !== 'pareja' && partnerName.toLowerCase() !== 'tu pareja' ? partnerName : null) ||
    'tu pareja';
  const displayPartnerName = capitalize(rawPartnerName);

  // Cargar regla y banderas de privacidad sincronizadas desde el backend (Near Real-Time)
  useEffect(() => {
    if (splitRules && splitRules.length > 0) {
      const defaultRule = splitRules.find((r) => r.isDefault || r.splitType === 'PROPORTIONAL') || splitRules[0];
      if (defaultRule) {
        const incomeA = defaultRule.partnerAIncome ?? 0;
        const incomeB = defaultRule.partnerBIncome ?? 0;

        // Parsear banderas de privacidad guardadas en el nombre de la regla: e.g. [hideA:true,hideB:false]
        const ruleName = defaultRule.name || '';
        const hideAMatch = ruleName.match(/hideA:(true|false)/);
        const hideBMatch = ruleName.match(/hideB:(true|false)/);
        const hideA = hideAMatch ? hideAMatch[1] === 'true' : false;
        const hideB = hideBMatch ? hideBMatch[1] === 'true' : false;

        // Mi privacidad y la de mi pareja según rol (Owner = A, Partner = B)
        const myHide = isOwner ? hideA : hideB;
        const partnerHide = isOwner ? hideB : hideA;

        setPartnerHidesFromMe(partnerHide);

        const myIncome = isOwner ? incomeA : incomeB;
        const partnerIncome = isOwner ? incomeB : incomeA;

        // El sueldo de la pareja SIEMPRE se actualiza en tiempo real cuando la pareja lo cambia
        setPartnerIncomeInput(String(partnerIncome));
        setMonthlyIncomes(myIncome, partnerIncome);

        // Mi sueldo y mi bandera de privacidad solo se inicializan al cargar por primera vez
        // para no sobreescribir lo que el usuario esté escribiendo en ese momento
        if (!hasInitializedInputs) {
          setHideIncomeFromPartner(myHide);
          if (myIncome > 0) {
            setMyIncomeInput(String(myIncome));
          }
          setHasInitializedInputs(true);
        }
      }
    }
  }, [splitRules, hasInitializedInputs, isOwner, setMonthlyIncomes]);

  const toggleHideIncome = () => {
    setHideIncomeFromPartner((prev) => !prev);
  };

  const handleSaveIncomes = async (e: React.FormEvent) => {
    e.preventDefault();
    const myInc = parseFloat(myIncomeInput) || 0;
    const partnerInc = parseFloat(partnerIncomeInput) || 0;
    setMonthlyIncomes(myInc, partnerInc);
    setIsSavingIncome(true);

    if (activeWorkspaceId) {
      try {
        // Asignar correctamente A y B según quién está guardando
        const partnerAIncome = isOwner ? myInc : partnerInc;
        const partnerBIncome = isOwner ? partnerInc : myInc;

        const total = partnerAIncome + partnerBIncome;
        const aPct = total > 0 ? Math.round((partnerAIncome / total) * 100) : 50;
        const bPct = 100 - aPct;

        const existingRule = splitRules.find((r) => r.isDefault || r.splitType === 'PROPORTIONAL') || splitRules[0];

        // Preservar la privacidad del otro y actualizar la mía
        let prevHideA = false;
        let prevHideB = false;
        if (existingRule?.name) {
          const mA = existingRule.name.match(/hideA:(true|false)/);
          const mB = existingRule.name.match(/hideB:(true|false)/);
          if (mA) prevHideA = mA[1] === 'true';
          if (mB) prevHideB = mB[1] === 'true';
        }

        const newHideA = isOwner ? hideIncomeFromPartner : prevHideA;
        const newHideB = !isOwner ? hideIncomeFromPartner : prevHideB;
        const syncRuleName = `Repartición Proporcional [hideA:${newHideA},hideB:${newHideB}]`;

        if (existingRule?.id) {
          await updateSplitRuleMut({
            id: existingRule.id,
            payload: {
              name: syncRuleName,
              partnerAIncome,
              partnerBIncome,
              partnerAPercentage: aPct,
              partnerBPercentage: bPct,
              splitType: 'PROPORTIONAL',
              isDefault: true,
            },
          });
        } else {
          await createSplitRuleMut({
            workspaceId: activeWorkspaceId,
            name: syncRuleName,
            splitType: 'PROPORTIONAL',
            partnerAIncome,
            partnerBIncome,
            partnerAPercentage: aPct,
            partnerBPercentage: bPct,
            isDefault: true,
          });
        }

        await queryClient.invalidateQueries({ queryKey: ['splitRules'] });
        await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      } catch (err) {
        console.error('Error al guardar regla de ingresos en backend:', err);
      } finally {
        setIsSavingIncome(false);
      }
    } else {
      setIsSavingIncome(false);
    }

    setIncomeSaved(true);
    setTimeout(() => setIncomeSaved(false), 2500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !activeWorkspaceId) return;

    try {
      await createSubMut({
        workspaceId: activeWorkspaceId,
        name,
        amount: parseFloat(amount),
        dueDay: parseInt(dueDay, 10),
        category,
        currency,
      });
      setModalOpen(false);
      setName('');
      setAmount('');
      setDueDay('5');
    } catch (err) {
      console.error('Error al crear suscripción:', err);
    }
  };

  const getSubIcon = (cat?: string) => {
    switch (cat) {
      case 'HOUSING': return Home;
      case 'UTILITIES': return Zap;
      case 'SUBSCRIPTION': return Tv;
      case 'HEALTH': return Shield;
      case 'EDUCATION': return BookOpen;
      default: return Layers;
    }
  };

  const totalMonthlyCommitments = subs.reduce((acc, item) => acc + item.amount, 0);
  const currentDay = new Date().getDate();

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Gastos Fijos
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Gastos Fijos y Suscripciones
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Organiza tus gastos fijos del mes, mantén el control de vencimientos y nunca pagues mora.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gray-900 border border-gray-800 text-right">
            <span className="text-[10px] text-gray-400 font-medium block uppercase tracking-wider">Total Fijo Mensual</span>
            <span className="text-base font-extrabold text-amber-400">
              {formatCurrency(totalMonthlyCommitments, currency)}
            </span>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Agregar Pago Fijo
          </button>
        </div>
      </div>

      {/* Banner / Card de Ingresos Fijos y Proporción Pareja */}
      <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Ingresos y Sueldos Fijos Mensuales</h2>
              <p className="text-xs text-gray-400">
                {hasPartner
                  ? 'Define el sueldo mensual de cada uno para calcular automáticamente la proporción equitativa de gastos en pareja.'
                  : 'Registra tu ingreso o sueldo mensual recurrente para tener visibilidad de tu flujo neto.'}
              </p>
            </div>
          </div>

          {hasPartner && (
            <div className="flex items-center gap-2">
              {(() => {
                const u = parseFloat(myIncomeInput) || 0;
                const p = parseFloat(partnerIncomeInput) || 0;
                const tot = u + p;
                if (tot > 0) {
                  const uPct = ((u / tot) * 100).toFixed(1);
                  const pPct = ((p / tot) * 100).toFixed(1);
                  return (
                    <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                      Repartición: Tú {uPct}% | {displayPartnerName} {pPct}%
                    </span>
                  );
                }
                return (
                  <span className="text-xs font-medium px-3 py-1 rounded-xl bg-gray-800 text-gray-400">
                    Repartición: 50% / 50%
                  </span>
                );
              })()}
            </div>
          )}
        </div>

        <form onSubmit={handleSaveIncomes} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
                <span>Tu Sueldo Mensual ({currency})</span>
                <span className="text-[10px] text-emerald-400 font-normal flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Editable por ti
                </span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="Ej. 3500.00"
                value={myIncomeInput}
                onChange={(e) => setMyIncomeInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-indigo-500/40 focus:border-indigo-500 text-xs text-white placeholder-gray-500 outline-none transition-colors"
              />
            </div>

            {hasPartner ? (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 flex items-center justify-between">
                  <span>Sueldo de {displayPartnerName} ({currency})</span>
                  <div className="flex items-center gap-1.5">
                    {partnerHidesFromMe ? (
                      <span className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-400" /> Privado por decisión de {displayPartnerName}
                      </span>
                    ) : (
                      <>
                        <span className="text-[10px] text-gray-500 font-normal flex items-center gap-1">
                          <Lock className="w-3 h-3 text-gray-500" /> Ingresado por {displayPartnerName}
                        </span>
                        {partnerIncomeInput && (
                          <button
                            type="button"
                            onClick={() => setShowPartnerIncome(!showPartnerIncome)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5 ml-1 cursor-pointer"
                            title={showPartnerIncome ? "Ocultar monto" : "Ver monto"}
                          >
                            {showPartnerIncome ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showPartnerIncome ? 'Ocultar' : 'Ver'}</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    disabled
                    placeholder="Sin registrar aún por pareja"
                    value={
                      !partnerIncomeInput
                        ? ''
                        : partnerHidesFromMe
                        ? '•••••••••••• (Confidencial)'
                        : showPartnerIncome
                        ? `${currency} ${parseFloat(partnerIncomeInput).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
                        : '••••••••'
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none cursor-not-allowed select-none font-medium tracking-wide ${
                      partnerHidesFromMe
                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-300/80 placeholder-amber-400/50'
                        : 'bg-gray-900/50 border-gray-800 text-gray-300 placeholder-gray-600'
                    }`}
                  />
                  {(partnerHidesFromMe || (!showPartnerIncome && partnerIncomeInput)) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                        partnerHidesFromMe
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-gray-800/80 text-gray-400 border-gray-700/50'
                      }`}>
                        {partnerHidesFromMe ? 'Privado' : 'Oculto'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:block"></div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSavingIncome}
                className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSavingIncome ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin text-indigo-300" />
                    <span>Guardando...</span>
                  </>
                ) : incomeSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Mi Sueldo Guardado</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>Actualizar Mi Sueldo</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Opciones de Privacidad para la pareja */}
          {hasPartner && (
            <div className="pt-2 border-t border-gray-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleHideIncome}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    hideIncomeFromPartner
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {hideIncomeFromPartner ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-gray-400" />}
                  <span>
                    {hideIncomeFromPartner
                      ? 'Modo Privacidad Activo: Ocultar mi monto exacto a mi pareja'
                      : 'Ocultar mi monto exacto a mi pareja (Modo Privacidad)'}
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-gray-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>La repartición proporcional de gastos seguirá calculándose de forma 100% matemática y exacta.</span>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Grid de Gastos Fijos */}
      {isLoading ? (
        <div className="h-64 rounded-2xl bg-gray-900/60 animate-pulse border border-gray-800/50 flex items-center justify-center text-xs text-gray-500">
          Cargando facturas y suscripciones...
        </div>
      ) : subs.length === 0 ? (
        <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-white">Sin suscripciones o servicios registrados</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Registra tus compromisos mensuales (Alquiler, Luz, Agua, Internet, Streaming, Gimnasio) para recibir alertas antes de la fecha de cobro.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" /> Agregar Mi Primer Pago Fijo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subs.map((sub) => {
            const Icon = getSubIcon(sub.category);
            const isPastDue = !sub.isPaidThisMonth && sub.dueDay < currentDay;

            return (
              <div
                key={sub.id}
                className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white truncate max-w-[160px]">{sub.name}</h3>
                        <span className="text-[10px] text-gray-400 font-medium">
                          Vence el día {sub.dueDay} de cada mes
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteSubMut(sub.id)}
                      className="p-1.5 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Eliminar pago fijo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800/60 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Monto Mensual</span>
                    <span className="text-lg font-extrabold text-white">
                      {formatCurrency(sub.amount, sub.currency || currency)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-800/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => togglePaidMut(sub.id)}
                    className={`w-full py-2 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      sub.isPaidThisMonth
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-amber-600/20 text-amber-300 border-amber-500/30 hover:bg-amber-600/30'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {sub.isPaidThisMonth ? 'Pagado este Mes' : 'Marcar como Pagado'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear Pago Fijo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0f172a] border border-gray-800 p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-white">Nuevo Pago Fijo Recurrente</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Concepto o Servicio</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Alquiler de Departamento, Netflix, Luz"
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Monto Mensual (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1500.00"
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Día de Cobro (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Categoría del Servicio</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="HOUSING">🏠 Alquiler / Hipoteca</option>
                  <option value="UTILITIES">⚡ Servicios (Luz, Agua, Internet)</option>
                  <option value="SUBSCRIPTION">📺 Streaming / Suscripciones</option>
                  <option value="HEALTH">🛡️ Seguro de Salud / Médico</option>
                  <option value="EDUCATION">📚 Educación / Cursos</option>
                  <option value="OTHER">📦 Otro Compromiso</option>
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
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? 'Guardando...' : 'Registrar Pago Fijo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
