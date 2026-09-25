'use client';

import React, { useState, useId } from 'react';
import {
  Wallet,
  ArrowRight,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  Building2,
  AlertCircle,
  Play,
  RotateCcw,
  Percent,
  Coins,
  ShieldCheck,
  Check,
  ArrowLeftRight,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { AccountDTO } from '@/features/accounts/types/accounts';
import { InvestmentDTO } from '@/features/investments/types/investments';
import { SalaryDistributionConfig, SalaryDistributionBranch } from '../types/subscriptions';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';

interface SalaryDistributionFlowProps {
  salaryAmount: number;
  currency: string;
  accounts: AccountDTO[];
  coupleAccounts?: AccountDTO[];
  investments?: InvestmentDTO[];
  coupleInvestments?: InvestmentDTO[];
  config: SalaryDistributionConfig;
  onSaveConfig: (newConfig: SalaryDistributionConfig) => Promise<void>;
  onExecuteDistribution: (branches: {
    destinationType?: 'ACCOUNT' | 'INVESTMENT';
    targetId: string;
    targetName: string;
    amount: number;
    currency: string;
    originalAmount?: number;
    originalCurrency?: string;
    workspaceId: string;
  }[]) => Promise<void>;
  isExecuting?: boolean;
}

export const SalaryDistributionFlow: React.FC<SalaryDistributionFlowProps> = ({
  salaryAmount,
  currency,
  accounts,
  coupleAccounts = [],
  investments = [],
  coupleInvestments = [],
  config,
  onSaveConfig,
  onExecuteDistribution,
  isExecuting = false,
}) => {
  const [localConfig, setLocalConfig] = useState<SalaryDistributionConfig>(() => ({
    enabled: config.enabled ?? true,
    frequency: config.frequency || 'MONTHLY',
    paymentDay: config.paymentDay || 30,
    distributionType: config.distributionType || 'SPLIT',
    primaryAccountId: config.primaryAccountId || accounts[0]?.id || '',
    branches:
      config.branches && config.branches.length > 0
        ? config.branches
        : accounts.length > 0
        ? [
            {
              id: 'branch-1',
              destinationType: 'ACCOUNT',
              targetAccountId: accounts[0]?.id || '',
              targetAccountName: accounts[0]?.name || 'Cuenta Principal',
              targetWorkspaceId: accounts[0]?.workspaceId,
              workspaceType: 'PERSONAL',
              mode: 'PERCENTAGE',
              value: 70,
              label: 'Gastos y Consumo Diario',
            },
            ...(accounts.length > 1
              ? [
                  {
                    id: 'branch-2',
                    destinationType: 'ACCOUNT' as const,
                    targetAccountId: accounts[1]?.id || '',
                    targetAccountName: accounts[1]?.name || 'Segunda Cuenta',
                    targetWorkspaceId: accounts[1]?.workspaceId,
                    workspaceType: 'PERSONAL' as const,
                    mode: 'PERCENTAGE' as const,
                    value: 30,
                    label: 'Ahorro / Emergencia',
                  },
                ]
              : []),
          ]
        : [],
    autoExecute: config.autoExecute ?? false,
    lastExecutedDate: config.lastExecutedDate,
  }));

  const [hasSaved, setHasSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [executionSuccess, setExecutionSuccess] = useState(false);

  // Unir todas las cuentas disponibles indicando de qué workspace son
  const allAvailableAccounts = [
    ...accounts.map((a) => ({ ...a, workspaceType: 'PERSONAL' as const, groupLabel: '👤 Mis Cuentas Personales' })),
    ...coupleAccounts.map((a) => ({ ...a, workspaceType: 'COUPLE' as const, groupLabel: '👥 Cuentas Compartidas de Pareja' })),
  ];

  // Unir todas las inversiones disponibles
  const allAvailableInvestments = [
    ...investments.map((inv) => ({ ...inv, workspaceType: 'PERSONAL' as const, groupLabel: '📈 Mis Inversiones Personales' })),
    ...coupleInvestments.map((inv) => ({ ...inv, workspaceType: 'COUPLE' as const, groupLabel: '👥 Inversiones de Pareja' })),
  ];

  const convert = useExchangeRateStore((s) => s.convert);

  // Calcular montos de cada rama y su conversión a la moneda del destino (cuenta o inversión)
  const calculatedBranches = localConfig.branches.map((b) => {
    let computedAmount = 0;
    if (b.mode === 'PERCENTAGE') {
      computedAmount = (salaryAmount * (b.value || 0)) / 100;
    } else {
      computedAmount = b.value || 0;
    }
    const roundedSalaryCurAmount = Math.round(computedAmount * 100) / 100;

    let targetCurrency = currency;
    const isInvestment = b.destinationType === 'INVESTMENT';

    if (isInvestment) {
      const targetInv = allAvailableInvestments.find((inv) => inv.id === b.targetInvestmentId);
      targetCurrency = targetInv?.currency || currency;
    } else {
      const targetAccount = allAvailableAccounts.find((a) => a.id === b.targetAccountId);
      targetCurrency = targetAccount?.currency || currency;
    }

    const isDifferentCurrency = targetCurrency.toUpperCase() !== currency.toUpperCase();

    // Convertir si el destino tiene otra moneda (ej. PEN -> USD)
    const convertedAmount = isDifferentCurrency
      ? convert(roundedSalaryCurAmount, currency, targetCurrency)
      : roundedSalaryCurAmount;

    // Calcular tipo de cambio unitario de referencia
    const unitRate = isDifferentCurrency ? convert(1, currency, targetCurrency) : 1;

    return {
      ...b,
      isInvestment,
      computedAmount: roundedSalaryCurAmount,
      targetCurrency,
      isDifferentCurrency,
      convertedAmount,
      unitRate,
    };
  });

  const totalAssignedAmount =
    localConfig.distributionType === 'TOTAL'
      ? salaryAmount
      : calculatedBranches.reduce((sum, b) => sum + b.computedAmount, 0);

  const remainingAmount = Math.round((salaryAmount - totalAssignedAmount) * 100) / 100;
  const isOverAllocated = remainingAmount < -0.01;
  const isFullyAllocated = Math.abs(remainingAmount) <= 0.01 && salaryAmount > 0;

  const handleAddBranch = () => {
    if (allAvailableAccounts.length === 0) return;
    const firstAcc = allAvailableAccounts[0];
    const newBranch: SalaryDistributionBranch = {
      id: `branch-${Date.now()}`,
      targetAccountId: firstAcc.id,
      targetAccountName: firstAcc.name,
      targetWorkspaceId: firstAcc.workspaceId,
      workspaceType: firstAcc.workspaceType,
      mode: 'PERCENTAGE',
      value: Math.max(0, Math.round(((remainingAmount > 0 ? remainingAmount : 0) / (salaryAmount || 1)) * 100)),
      label: 'Destino Asignado',
    };

    setLocalConfig((prev) => ({
      ...prev,
      branches: [...prev.branches, newBranch],
    }));
  };

  const handleRemoveBranch = (id: string) => {
    setLocalConfig((prev) => ({
      ...prev,
      branches: prev.branches.filter((b) => b.id !== id),
    }));
  };

  const handleUpdateBranch = (id: string, updates: Partial<SalaryDistributionBranch>) => {
    setLocalConfig((prev) => ({
      ...prev,
      branches: prev.branches.map((b) => {
        if (b.id !== id) return b;
        const updated = { ...b, ...updates };

        // Si cambia el destino de cuenta
        if (updates.targetAccountId) {
          const accFound = allAvailableAccounts.find((a) => a.id === updates.targetAccountId);
          if (accFound) {
            updated.destinationType = 'ACCOUNT';
            updated.targetAccountName = accFound.name;
            updated.targetWorkspaceId = accFound.workspaceId;
            updated.workspaceType = accFound.workspaceType;
          }
        }

        // Si cambia el destino a inversión
        if (updates.targetInvestmentId) {
          const invFound = allAvailableInvestments.find((inv) => inv.id === updates.targetInvestmentId);
          if (invFound) {
            updated.destinationType = 'INVESTMENT';
            updated.targetInvestmentName = invFound.name;
            updated.targetWorkspaceId = invFound.workspaceId;
            updated.workspaceType = invFound.workspaceType;
          }
        }

        return updated;
      }),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveConfig(localConfig);
      setHasSaved(true);
      setTimeout(() => setHasSaved(false), 3000);
    } catch (err) {
      console.error('Error guardando configuración de sueldo:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteNow = async () => {
    if (salaryAmount <= 0) return;
    try {
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

      if (localConfig.distributionType === 'TOTAL') {
        const acc = allAvailableAccounts.find((a) => a.id === localConfig.primaryAccountId) || allAvailableAccounts[0];
        if (acc) {
          const accCur = acc.currency || currency;
          const isDiff = accCur.toUpperCase() !== currency.toUpperCase();
          const finalAmount = isDiff ? convert(salaryAmount, currency, accCur) : salaryAmount;

          targets = [
            {
              destinationType: 'ACCOUNT',
              targetId: acc.id,
              targetName: acc.name,
              amount: finalAmount,
              currency: accCur,
              originalAmount: salaryAmount,
              originalCurrency: currency,
              workspaceId: acc.workspaceId || '',
            },
          ];
        }
      } else {
        targets = calculatedBranches
          .map((b) => {
            const isInv = b.destinationType === 'INVESTMENT';
            if (isInv) {
              const inv = allAvailableInvestments.find((i) => i.id === b.targetInvestmentId);
              return {
                destinationType: 'INVESTMENT' as const,
                targetId: b.targetInvestmentId || '',
                targetName: b.targetInvestmentName || inv?.name || 'Inversión Destino',
                amount: b.convertedAmount,
                currency: b.targetCurrency,
                originalAmount: b.computedAmount,
                originalCurrency: currency,
                workspaceId: b.targetWorkspaceId || inv?.workspaceId || '',
              };
            }

            const acc = allAvailableAccounts.find((a) => a.id === b.targetAccountId);
            return {
              destinationType: 'ACCOUNT' as const,
              targetId: b.targetAccountId || '',
              targetName: b.targetAccountName || acc?.name || 'Cuenta Destino',
              amount: b.convertedAmount,
              currency: b.targetCurrency,
              originalAmount: b.computedAmount,
              originalCurrency: currency,
              workspaceId: b.targetWorkspaceId || acc?.workspaceId || '',
            };
          })
          .filter((t) => t.amount > 0 && t.targetId);
      }

      await onExecuteDistribution(targets);
      setExecutionSuccess(true);
      setTimeout(() => setExecutionSuccess(false), 5000);
    } catch (err) {
      console.error('Error ejecutando abono inmediato:', err);
    }
  };

  return (
    <div className="rounded-3xl bg-[#090d16] border border-gray-800/80 p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Luces y acentos de fondo */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header del Flujo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-800/70 relative z-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automatización Inteligente de Sueldo</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Flujo de Abono y Distribución a Cuentas
          </h2>
          <p className="text-xs text-gray-400 max-w-xl">
            Programa el abono recurrente de tu sueldo mensual. Decide si ingresa al 100% en una cuenta principal o si se ramifica automáticamente a cuentas personales o al fondo común de pareja.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            {hasSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>¡Regla Guardada!</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-indigo-300" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Regla'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExecuteNow}
            disabled={isExecuting || salaryAmount <= 0}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
            title="Genera las transacciones de ingreso reales ahora mismo en tus cuentas bancarias"
          >
            {isExecuting ? (
              <RotateCcw className="w-4 h-4 animate-spin text-emerald-200" />
            ) : executionSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isExecuting ? 'Abonando...' : executionSuccess ? '¡Abono Realizado!' : 'Abonar Ahora'}</span>
          </button>
        </div>
      </div>

      {executionSuccess && (
        <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in-50">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold">¡Abono registrado con éxito en tus cuentas!</p>
            <p className="text-[11px] text-emerald-400/80">
              Se crearon las transacciones de ingreso correspondientes y los saldos de tus cuentas se actualizaron.
            </p>
          </div>
        </div>
      )}

      {/* Controles de Configuración de Tiempo */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#0e1422] border border-gray-800 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">Día de Abono / Cobro</label>
          <div className="relative">
            <select
              value={localConfig.paymentDay}
              onChange={(e) => setLocalConfig((prev) => ({ ...prev, paymentDay: parseInt(e.target.value) || 30 }))}
              className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-white font-medium outline-none focus:border-indigo-500 appearance-none pr-8 cursor-pointer"
            >
              {[...Array(31)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Día {i + 1} de cada mes {i + 1 === 30 || i + 1 === 31 ? '(Fin de mes)' : i + 1 === 15 ? '(Quincena)' : ''}
                </option>
              ))}
            </select>
            <Calendar className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">Frecuencia de Ingreso</label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-900 rounded-xl border border-gray-800">
            <button
              type="button"
              onClick={() => setLocalConfig((prev) => ({ ...prev, frequency: 'MONTHLY' }))}
              className={`py-1 rounded-lg text-center font-medium transition-all ${
                localConfig.frequency === 'MONTHLY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setLocalConfig((prev) => ({ ...prev, frequency: 'BIWEEKLY' }))}
              className={`py-1 rounded-lg text-center font-medium transition-all ${
                localConfig.frequency === 'BIWEEKLY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Quincenal
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1">Modo de Distribución</label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-900 rounded-xl border border-gray-800">
            <button
              type="button"
              onClick={() => setLocalConfig((prev) => ({ ...prev, distributionType: 'TOTAL' }))}
              className={`py-1 rounded-lg text-center font-medium transition-all ${
                localConfig.distributionType === 'TOTAL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              100% Única Cuenta
            </button>
            <button
              type="button"
              onClick={() => setLocalConfig((prev) => ({ ...prev, distributionType: 'SPLIT' }))}
              className={`py-1 rounded-lg text-center font-medium transition-all ${
                localConfig.distributionType === 'SPLIT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Ramificado Multi-Cuenta
            </button>
          </div>
        </div>
      </div>

      {/* Switch de Auto-Abono Automático Mensual */}
      <div className="mt-3.5 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border transition-colors ${
            localConfig.autoExecute
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-gray-800/60 border-gray-700/50 text-gray-400'
          }`}>
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Auto-Abono Programado (100% Automático)</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                localConfig.autoExecute
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 border-gray-700'
              }`}>
                {localConfig.autoExecute ? 'Activo' : 'Manual'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              {localConfig.autoExecute
                ? `Al llegar el día ${localConfig.paymentDay} de cada mes, Dualis ejecutará la distribución automáticamente a tus cuentas e inversiones sin que tengas que hacerlo a mano.`
                : 'Activa esta opción para que el sistema abone de forma automática el día programado.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const nextVal = !localConfig.autoExecute;
            setLocalConfig((prev) => ({ ...prev, autoExecute: nextVal }));
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            localConfig.autoExecute ? 'bg-indigo-600' : 'bg-gray-800'
          }`}
          role="switch"
          aria-checked={localConfig.autoExecute}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              localConfig.autoExecute ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* DIAGRAMA DE FLUJO INTERACTIVO */}
      <div className="mt-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* NODO ORIGEN: SUELDO MENSUAL */}
          <div className="lg:col-span-4">
            <div className="relative p-5 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-[#0e1a17] to-gray-950 border-2 border-emerald-500/40 shadow-xl group hover:border-emerald-400 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Fuente de Ingreso
                </span>
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-xs text-gray-400 font-medium">Sueldo / Ingreso Fijo</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xs text-emerald-400 font-bold">{currency}</span>
                <span className="text-2xl font-black text-white tracking-tight">
                  {salaryAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-500/20 text-[11px] text-gray-400 flex items-center justify-between">
                <span>Día programado:</span>
                <span className="text-white font-semibold">{localConfig.paymentDay} de cada mes</span>
              </div>
            </div>
          </div>

          {/* CONECTOR CENTRAL CONECTADO (FLECHA INTERACTIVA / INDICADOR DE FLUJO) */}
          <div className="lg:col-span-1 hidden lg:flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* NODO(S) DESTINO: CUENTA TOTAL O RAMAS DIVIDIDAS */}
          <div className="lg:col-span-7 space-y-4">
            {localConfig.distributionType === 'TOTAL' ? (
              /* MODO TOTAL (100% a una cuenta) */
              <div className="p-5 rounded-3xl bg-[#0f172a] border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                    <Building2 className="w-4 h-4" />
                    <span>Cuenta Receptora Única (100%)</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Abono Íntegro
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Selecciona la cuenta donde caerá tu sueldo:</label>
                  <select
                    value={localConfig.primaryAccountId}
                    onChange={(e) => setLocalConfig((prev) => ({ ...prev, primaryAccountId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white font-medium outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {allAvailableAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.groupLabel.split(' ')[0]} {acc.name} — Saldo: {acc.currency || 'PEN'} {acc.balance ?? 0}
                      </option>
                    ))}
                  </select>
                </div>
                {(() => {
                  const targetAcc = allAvailableAccounts.find((a) => a.id === localConfig.primaryAccountId);
                  const targetCur = targetAcc?.currency || currency;
                  const isDiff = targetCur.toUpperCase() !== currency.toUpperCase();
                  const convertedTotal = isDiff ? convert(salaryAmount, currency, targetCur) : salaryAmount;
                  const unitRate = isDiff ? convert(1, currency, targetCur) : 1;

                  return (
                    <div className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-gray-300">
                        <span className="text-gray-400">Total a recibir en cuenta:</span>
                        <div className="flex items-center gap-2">
                          {isDiff && (
                            <span className="text-xs text-gray-500 line-through">
                              {currency} {salaryAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          <span className="text-sm font-bold text-emerald-400">
                            {targetCur} {convertedTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {isDiff && (
                        <div className="flex items-center justify-between pt-1 border-t border-gray-800/60 text-[11px] text-indigo-300">
                          <span className="flex items-center gap-1 text-gray-400">
                            <ArrowLeftRight className="w-3 h-3 text-indigo-400" />
                            Tipo de cambio aplicado:
                          </span>
                          <span className="font-semibold">
                            1 {currency} ≈ {unitRate.toFixed(4)} {targetCur}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* MODO RAMIFICADO (SPLIT A MÚLTIPLES CUENTAS) */
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Ramas de Distribución ({localConfig.branches.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBranch}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Rama / Cuenta</span>
                  </button>
                </div>

                {/* Lista de ramas */}
                {localConfig.branches.map((branch, index) => {
                  const branchComputed = calculatedBranches.find((b) => b.id === branch.id);
                  return (
                    <div
                      key={branch.id}
                      className="p-4 rounded-2xl bg-[#0f172a]/90 border border-gray-800 hover:border-gray-700 transition-all space-y-3 shadow-md relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={branch.label || ''}
                            placeholder="Etiqueta (ej. Ahorros, Gastos diarios)"
                            onChange={(e) => handleUpdateBranch(branch.id, { label: e.target.value })}
                            className="bg-transparent border-none text-xs text-white font-semibold placeholder-gray-500 focus:outline-none focus:ring-0 w-full"
                          />
                        </div>

                        {/* Botón eliminar rama */}
                        {localConfig.branches.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBranch(branch.id)}
                            className="p-1 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Eliminar esta rama"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        {/* Selector de cuenta o inversión destino */}
                        <div className="sm:col-span-6">
                          <label className="block text-[10px] text-gray-400 mb-0.5">Destino (Cuenta o Inversión)</label>
                          <select
                            value={
                              branch.destinationType === 'INVESTMENT'
                                ? `inv:${branch.targetInvestmentId}`
                                : `acc:${branch.targetAccountId}`
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.startsWith('inv:')) {
                                const invId = val.replace('inv:', '');
                                handleUpdateBranch(branch.id, {
                                  destinationType: 'INVESTMENT',
                                  targetInvestmentId: invId,
                                  targetAccountId: undefined,
                                });
                              } else {
                                const accId = val.replace('acc:', '');
                                handleUpdateBranch(branch.id, {
                                  destinationType: 'ACCOUNT',
                                  targetAccountId: accId,
                                  targetInvestmentId: undefined,
                                });
                              }
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <optgroup label="👤 Mis Cuentas Personales">
                              {accounts.map((a) => (
                                <option key={`acc-${a.id}`} value={`acc:${a.id}`}>
                                  💳 {a.name} ({a.currency || 'PEN'} {a.balance ?? 0})
                                </option>
                              ))}
                            </optgroup>
                            {coupleAccounts.length > 0 && (
                              <optgroup label="👥 Cuentas Compartidas de Pareja">
                                {coupleAccounts.map((a) => (
                                  <option key={`acc-${a.id}`} value={`acc:${a.id}`}>
                                    👥 {a.name} ({a.currency || 'PEN'} {a.balance ?? 0})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {allAvailableInvestments.length > 0 && (
                              <optgroup label="📈 Portafolio de Inversiones (Aporte)">
                                {allAvailableInvestments.map((inv) => (
                                  <option key={`inv-${inv.id}`} value={`inv:${inv.id}`}>
                                    📈 {inv.name} ({inv.institution || inv.type}) — {inv.currency || 'PEN'}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>

                        {/* Modo (Porcentaje vs Monto Fijo) */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] text-gray-400 mb-0.5">Asignación</label>
                          <div className="flex items-center gap-1 bg-gray-900 rounded-xl border border-gray-800 p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateBranch(branch.id, { mode: 'PERCENTAGE' })}
                              className={`flex-1 py-1 rounded-lg text-[10px] font-semibold flex items-center justify-center transition-all ${
                                branch.mode === 'PERCENTAGE' ? 'bg-indigo-600 text-white' : 'text-gray-400'
                              }`}
                            >
                              <Percent className="w-2.5 h-2.5 mr-0.5" /> %
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBranch(branch.id, { mode: 'FIXED' })}
                              className={`flex-1 py-1 rounded-lg text-[10px] font-semibold flex items-center justify-center transition-all ${
                                branch.mode === 'FIXED' ? 'bg-indigo-600 text-white' : 'text-gray-400'
                              }`}
                            >
                              <Coins className="w-2.5 h-2.5 mr-0.5" /> Fijo
                            </button>
                          </div>
                        </div>

                        {/* Input de Valor */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] text-gray-400 mb-0.5">
                            {branch.mode === 'PERCENTAGE' ? 'Porcentaje' : 'Monto Fijo'}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              value={branch.value ?? ''}
                              onChange={(e) =>
                                handleUpdateBranch(branch.id, { value: parseFloat(e.target.value) || 0 })
                              }
                              placeholder="0"
                              className="w-full px-2.5 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white font-bold outline-none focus:border-indigo-500"
                            />
                            <span className="text-[10px] text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 font-semibold">
                              {branch.mode === 'PERCENTAGE' ? '%' : currency}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Monto proyectado para esta rama y conversión si aplica */}
                      <div className="pt-2 border-t border-gray-800/60 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            {branchComputed?.isInvestment ? (
                              <>
                                <TrendingUp className="w-3 h-3 text-indigo-400" />
                                <span>Aporte a inversión:</span>
                              </>
                            ) : (
                              <>
                                <Building2 className="w-3 h-3 text-emerald-400" />
                                <span>Abonará en cuenta:</span>
                              </>
                            )}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {branchComputed?.isDifferentCurrency && (
                              <span className="text-[10px] text-gray-500 line-through">
                                {currency} {(branchComputed?.computedAmount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                            <span className="text-xs font-bold text-emerald-400">
                              {branchComputed?.targetCurrency || currency}{' '}
                              {(branchComputed?.convertedAmount ?? branchComputed?.computedAmount ?? 0).toLocaleString('es-PE', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>

                        {branchComputed?.isDifferentCurrency && (
                          <div className="flex items-center justify-between text-[10px] text-indigo-300/90 pt-0.5">
                            <span className="flex items-center gap-1 text-gray-500">
                              <ArrowLeftRight className="w-2.5 h-2.5 text-indigo-400" />
                              Tipo de cambio:
                            </span>
                            <span className="font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                              1 {currency} ≈ {(branchComputed?.unitRate || 0).toFixed(4)} {branchComputed?.targetCurrency}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Barra de Balance / Cuadratura de Distribución */}
                <div className="p-3.5 rounded-2xl bg-gray-950 border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">Asignado:</span>
                    <div className="flex items-center gap-1 font-bold">
                      <span className={isOverAllocated ? 'text-rose-400' : isFullyAllocated ? 'text-emerald-400' : 'text-amber-400'}>
                        {currency} {totalAssignedAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-gray-500 font-normal">/ {currency} {salaryAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full h-2 rounded-full bg-gray-900 overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isOverAllocated
                          ? 'bg-rose-500'
                          : isFullyAllocated
                          ? 'bg-emerald-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{
                        width: `${Math.min(100, salaryAmount > 0 ? (totalAssignedAmount / salaryAmount) * 100 : 0)}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    {isOverAllocated ? (
                      <span className="text-rose-400 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Excedes el sueldo por {currency} {Math.abs(remainingAmount).toFixed(2)}
                      </span>
                    ) : isFullyAllocated ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        100% de tu sueldo está distribuido a cuentas
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Sobrante sin asignar: {currency} {remainingAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
