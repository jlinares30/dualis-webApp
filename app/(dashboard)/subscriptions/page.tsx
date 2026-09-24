'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, Clock, Trash2, Home, Zap, Tv, Shield, BookOpen, Layers, TrendingUp, Wallet, Check, Sparkles, Lock, UserCheck, Eye, EyeOff, ChevronDown, Sliders, Activity, Receipt, X } from 'lucide-react';
import { formatCurrency, capitalize } from '@/lib/utils';
import { useSubscriptions, useCreateSubscription, useToggleSubscriptionPaid, useDeleteSubscription } from '@/features/subscriptions';
import { useSplitRules, useCreateSplitRule, useUpdateSplitRule, useCreateTransaction } from '@/features/transactions';
import { useAccounts } from '@/features/accounts';
import { useInvestments } from '@/features/investments';
import { SalaryDistributionFlow } from '@/features/subscriptions/components/salary-distribution-flow';
import { SalaryDistributionConfig } from '@/features/subscriptions/types/subscriptions';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';
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
  const [isVariableAmount, setIsVariableAmount] = useState(false);

  // Modal para confirmar pago con ajuste de monto real en servicios variables
  const [payingSub, setPayingSub] = useState<{ id: string; name: string; amount: number; isVariable: boolean; currency: string } | null>(null);
  const [actualPaidAmount, setActualPaidAmount] = useState<string>('');
  const [payingAccountId, setPayingAccountId] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Cuentas personales y de pareja para distribución de sueldo y pagos
  const personalWs = workspaces.find((w) => w.type === 'INDIVIDUAL');
  const coupleWs = workspaces.find((w) => w.type === 'COUPLE');
  const { data: accountsData = [] } = useAccounts(personalWs?.id || activeWorkspaceId || undefined);
  const { data: coupleAccountsData = [] } = useAccounts(coupleWs?.id || undefined);
  const { data: investmentsData = [] } = useInvestments(personalWs?.id || activeWorkspaceId || undefined);
  const { data: coupleInvestmentsData = [] } = useInvestments(coupleWs?.id || undefined);
  const { mutateAsync: createTxMut } = useCreateTransaction();

  // Función para confirmar el pago (con monto real si fue editado)
  const handleConfirmBillPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSub) return;

    setIsProcessingPayment(true);
    try {
      const finalAmount = parseFloat(actualPaidAmount) || payingSub.amount;
      
      // Si seleccionó una cuenta o hay cuentas disponibles, opcionalmente creamos la transacción de gasto con el monto real
      if (payingAccountId && activeWorkspaceId) {
        const selectedAcc = [...accountsData, ...coupleAccountsData].find((a) => a.id === payingAccountId);
        await createTxMut({
          workspaceId: selectedAcc?.workspaceId || activeWorkspaceId,
          accountId: payingAccountId,
          amount: finalAmount,
          currency: payingSub.currency || currency,
          type: 'EXPENSE',
          description: `Pago de servicio: ${payingSub.name}${payingSub.isVariable ? ' (Recibo mensual ajustado)' : ''}`,
          transactionDate: new Date().toISOString(),
        });
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      }

      // Marcar suscripción / pago recurrente como pagado este mes
      await togglePaidMut(payingSub.id);
      setPayingSub(null);
      setActualPaidAmount('');
      setPayingAccountId('');
    } catch (err) {
      console.error('Error al registrar pago del servicio:', err);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Estado para el flujo de distribución (colapsado por defecto)
  const [showDistributionFlow, setShowDistributionFlow] = useState(false);
  const [isExecutingDistribution, setIsExecutingDistribution] = useState(false);
  const [salaryConfig, setSalaryConfig] = useState<SalaryDistributionConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`dualis_salary_flow_${activeWorkspaceId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return {
      enabled: true,
      frequency: 'MONTHLY',
      paymentDay: 30,
      distributionType: 'SPLIT',
      branches: [],
      autoExecute: false,
    };
  });

  const handleSaveSalaryConfig = async (newConfig: SalaryDistributionConfig) => {
    setSalaryConfig(newConfig);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`dualis_salary_flow_${activeWorkspaceId}`, JSON.stringify(newConfig));
    }
  };

  const handleExecuteSalaryDistribution = async (
    branches: {
      destinationType?: 'ACCOUNT' | 'INVESTMENT';
      targetId: string;
      targetName: string;
      amount: number; // Monto final a depositar
      currency: string;
      originalAmount?: number;
      originalCurrency?: string;
      workspaceId: string;
    }[]
  ) => {
    setIsExecutingDistribution(true);
    try {
      for (const branch of branches) {
        const isConverted = branch.originalCurrency && branch.originalCurrency !== branch.currency;
        const isInv = branch.destinationType === 'INVESTMENT';
        const actionPrefix = isInv ? 'Aporte a Inversión' : 'Abono de Sueldo';

        const desc = isConverted
          ? `${actionPrefix}: ${branch.targetName} (${branch.originalCurrency} ${branch.originalAmount?.toFixed(2)} ➔ ${branch.currency} ${branch.amount.toFixed(2)})`
          : `${actionPrefix}: ${branch.targetName}`;

        await createTxMut({
          workspaceId: branch.workspaceId || activeWorkspaceId!,
          accountId: branch.targetId,
          amount: branch.amount,
          currency: branch.currency,
          type: 'INCOME',
          description: desc,
          transactionDate: new Date().toISOString(),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    } finally {
      setIsExecutingDistribution(false);
    }
  };

  const [autoExecutedNotice, setAutoExecutedNotice] = useState<string | null>(null);
  const { convert } = useExchangeRateStore();

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

  // Detección automática al cargar: Si hoy es el día de pago o posterior y no se ha ejecutado este mes
  useEffect(() => {
    if (!salaryConfig.autoExecute || !activeWorkspaceId) return;

    const today = new Date();
    const currentDay = today.getDate();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Si ya se ejecutó este mes, evitar duplicar
    if (salaryConfig.lastExecutedDate === currentYearMonth) return;

    // Si ya alcanzó o superó el día de pago configurado
    if (currentDay >= (salaryConfig.paymentDay || 30)) {
      const mySalary = parseFloat(myIncomeInput) || userMonthlyIncome || 0;
      if (mySalary <= 0) return;

      const executeAuto = async () => {
        let targets: {
          destinationType?: 'ACCOUNT' | 'INVESTMENT';
          targetId: string;
          targetName: string;
          amount: number;
          currency: string;
          originalAmount?: number;
          originalCurrency?: string;
          workspaceId: string;
        }[] = [];

        if (salaryConfig.distributionType === 'TOTAL') {
          const acc = accountsData.find((a) => a.id === salaryConfig.primaryAccountId) || accountsData[0];
          if (acc) {
            const accCur = acc.currency || currency;
            const finalAmount = accCur !== currency ? convert(mySalary, currency, accCur) : mySalary;
            targets = [
              {
                destinationType: 'ACCOUNT',
                targetId: acc.id,
                targetName: acc.name,
                amount: finalAmount,
                currency: accCur,
                originalAmount: mySalary,
                originalCurrency: currency,
                workspaceId: acc.workspaceId || '',
              },
            ];
          }
        } else if (salaryConfig.branches && salaryConfig.branches.length > 0) {
          targets = salaryConfig.branches
            .map((b) => {
              const isInv = b.destinationType === 'INVESTMENT';
              let computed = b.mode === 'PERCENTAGE' ? (mySalary * (b.value || 0)) / 100 : b.value || 0;
              computed = Math.round(computed * 100) / 100;

              if (isInv) {
                const inv = [...investmentsData, ...coupleInvestmentsData].find((i) => i.id === b.targetInvestmentId);
                const invCur = inv?.currency || currency;
                const converted = invCur !== currency ? convert(computed, currency, invCur) : computed;
                return {
                  destinationType: 'INVESTMENT' as const,
                  targetId: b.targetInvestmentId || '',
                  targetName: b.targetInvestmentName || inv?.name || 'Inversión',
                  amount: converted,
                  currency: invCur,
                  originalAmount: computed,
                  originalCurrency: currency,
                  workspaceId: b.targetWorkspaceId || inv?.workspaceId || '',
                };
              }

              const acc = [...accountsData, ...coupleAccountsData].find((a) => a.id === b.targetAccountId);
              const accCur = acc?.currency || currency;
              const converted = accCur !== currency ? convert(computed, currency, accCur) : computed;
              return {
                destinationType: 'ACCOUNT' as const,
                targetId: b.targetAccountId || '',
                targetName: b.targetAccountName || acc?.name || 'Cuenta',
                amount: converted,
                currency: accCur,
                originalAmount: computed,
                originalCurrency: currency,
                workspaceId: b.targetWorkspaceId || acc?.workspaceId || '',
              };
            })
            .filter((t) => t.amount > 0 && t.targetId);
        }

        if (targets.length > 0) {
          try {
            await handleExecuteSalaryDistribution(targets);
            const updatedConfig = { ...salaryConfig, lastExecutedDate: currentYearMonth };
            setSalaryConfig(updatedConfig);
            if (typeof window !== 'undefined') {
              localStorage.setItem(`dualis_salary_flow_${activeWorkspaceId}`, JSON.stringify(updatedConfig));
            }
            setAutoExecutedNotice(
              `🎉 ¡Auto-Abono Ejecutado! Se distribuyeron automáticamente ${currency} ${mySalary.toFixed(2)} según tu regla programada del día ${salaryConfig.paymentDay}.`
            );
          } catch (autoErr) {
            console.error('Error ejecutando auto-abono programado:', autoErr);
          }
        }
      };

      executeAuto();
    }
  }, [salaryConfig, activeWorkspaceId, myIncomeInput, userMonthlyIncome, accountsData, coupleAccountsData, investmentsData, coupleInvestmentsData, currency, convert]);

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
        provider: isVariableAmount ? 'VARIABLE_BILL' : 'FIXED_BILL',
      });
      setModalOpen(false);
      setName('');
      setAmount('');
      setDueDay('5');
      setIsVariableAmount(false);
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

      {/* Notificación de Auto-Abono de Sueldo */}
      {autoExecutedNotice && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-[#0f172a] border border-emerald-500/40 shadow-xl flex items-center justify-between gap-3 text-xs animate-in fade-in-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Distribución Automática Realizada</p>
              <p className="text-emerald-300/90">{autoExecutedNotice}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoExecutedNotice(null)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer"
          >
            Entendido
          </button>
        </div>
      )}

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

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                disabled={isSavingIncome}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
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

              <button
                type="button"
                onClick={() => setShowDistributionFlow(!showDistributionFlow)}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                  showDistributionFlow
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-emerald-500/10'
                    : 'bg-gray-900 hover:bg-gray-800 border-gray-800 text-gray-300 hover:text-white'
                }`}
                title="Configura el reparto automático de este sueldo a tus cuentas e inversiones"
              >
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">
                  {showDistributionFlow ? 'Ocultar Distribución' : 'Configurar Abono'}
                </span>
                <span className="sm:hidden">Abono</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    showDistributionFlow ? 'rotate-180 text-emerald-400' : 'text-gray-400'
                  }`}
                />
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

      {/* Flujo Interactivo de Abono y Distribución a Cuentas e Inversiones (Expandible a demanda) */}
      {showDistributionFlow && (
        <div className="animate-in fade-in-50 zoom-in-95 duration-200">
          <SalaryDistributionFlow
            salaryAmount={parseFloat(myIncomeInput) || userMonthlyIncome || 0}
            currency={currency}
            accounts={accountsData}
            coupleAccounts={coupleAccountsData}
            investments={investmentsData}
            coupleInvestments={coupleInvestmentsData}
            config={salaryConfig}
            onSaveConfig={handleSaveSalaryConfig}
            onExecuteDistribution={handleExecuteSalaryDistribution}
            isExecuting={isExecutingDistribution}
          />
        </div>
      )}

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
            const isVariable = sub.provider === 'VARIABLE_BILL' || sub.category === 'UTILITIES';

            return (
              <div
                key={sub.id}
                className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-4 flex flex-col justify-between relative overflow-hidden group hover:border-gray-700/80 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-base text-white truncate max-w-[150px]">{sub.name}</h3>
                          {isVariable ? (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              📊 Variable
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              🔒 Fijo
                            </span>
                          )}
                        </div>
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
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">
                        {isVariable ? 'Estimado Mensual' : 'Monto Mensual'}
                      </span>
                      {isVariable && (
                        <span className="text-[10px] text-amber-400/80">Ajustable por recibo</span>
                      )}
                    </div>
                    <span className="text-lg font-extrabold text-white">
                      {formatCurrency(sub.amount, sub.currency || currency)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-800/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      if (sub.isPaidThisMonth) {
                        // Si ya está pagado, toggling lo desmarca
                        togglePaidMut(sub.id);
                      } else if (isVariable) {
                        // Si es variable, abrir modal para ingresar el monto exacto del recibo de este mes
                        setPayingSub({
                          id: sub.id,
                          name: sub.name,
                          amount: sub.amount,
                          isVariable: true,
                          currency: sub.currency || currency,
                        });
                        setActualPaidAmount(String(sub.amount));
                        setPayingAccountId(accountsData[0]?.id || coupleAccountsData[0]?.id || '');
                      } else {
                        // Si es fijo, permitir marcar directamente o abrir modal
                        togglePaidMut(sub.id);
                      }
                    }}
                    className={`w-full py-2 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      sub.isPaidThisMonth
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : isVariable
                        ? 'bg-gradient-to-r from-amber-600/30 to-orange-600/30 text-amber-300 border-amber-500/40 hover:from-amber-600/40 hover:to-orange-600/40 shadow-sm'
                        : 'bg-amber-600/20 text-amber-300 border-amber-500/30 hover:bg-amber-600/30'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {sub.isPaidThisMonth
                      ? 'Pagado este Mes'
                      : isVariable
                      ? 'Pagar Recibo con Monto Real'
                      : 'Marcar como Pagado'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Registrar Pago de Recibo Variable o Fijo con Monto Real */}
      {payingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0f172a] border border-amber-500/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Registrar Pago de Recibo</h3>
                  <p className="text-xs text-gray-400">{payingSub.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPayingSub(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmBillPayment} className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-amber-300 font-semibold block">Monto Estimado / Presupuestado</span>
                  <span className="text-xs text-gray-400">Promedio de referencia</span>
                </div>
                <span className="text-base font-extrabold text-amber-300">
                  {formatCurrency(payingSub.amount, payingSub.currency)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1">
                  Monto Real del Recibo de este Mes ({payingSub.currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    autoFocus
                    value={actualPaidAmount}
                    onChange={(e) => setActualPaidAmount(e.target.value)}
                    placeholder="Ej. 135.50"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-950 border border-amber-500/40 text-sm text-white font-extrabold outline-none focus:border-amber-400 pl-3"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Ingresa exactamente lo que vino facturado este mes en tu recibo de luz, agua o servicio.
                </p>
              </div>

              {/* Selector opcional de cuenta de débito */}
              {(accountsData.length > 0 || coupleAccountsData.length > 0) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    ¿De qué cuenta se pagó? (Opcional)
                  </label>
                  <select
                    value={payingAccountId}
                    onChange={(e) => setPayingAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">No registrar gasto en cuenta bancaria</option>
                    {accountsData.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        💳 {acc.name} ({acc.currency} {acc.balance.toFixed(2)}) - Personal
                      </option>
                    ))}
                    {coupleAccountsData.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        👥 {acc.name} ({acc.currency} {acc.balance.toFixed(2)}) - Compartida
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">
                    Si seleccionas una cuenta, se creará automáticamente la transacción de egreso con el monto exacto.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setPayingSub(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold transition-all shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isProcessingPayment ? 'Registrando...' : 'Confirmar Pago del Recibo'}
                </button>
              </div>
            </form>
          </div>
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

              {/* Tipo de Monto: Fijo vs Variable/Estimado */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Tipo de Monto</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-950 rounded-xl border border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsVariableAmount(false)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      !isVariableAmount
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🔒 Monto Fijo
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVariableAmount(true)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      isVariableAmount
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    📊 Variable / Estimado
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {isVariableAmount
                    ? 'Ideal para Luz, Agua o Gas. Ingresa un promedio mensual; podrás ajustar el valor exacto del recibo cada mes al pagar.'
                    : 'Para Alquiler, Netflix o membresías con monto idéntico todos los meses.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    {isVariableAmount ? 'Monto Estimado / Promedio (S/)' : 'Monto Mensual (S/)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={isVariableAmount ? 'Ej. 120.00 (Luz)' : '1500.00'}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500 font-bold"
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
