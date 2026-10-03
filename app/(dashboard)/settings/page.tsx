'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  User,
  HeartHandshake,
  Lock,
  Bell,
  Globe,
  ShieldCheck,
  Save,
  Check,
  UserPlus,
  UserMinus,
  Sparkles,
  Percent,
  RefreshCw,
  Coins,
  Plus,
  Search,
  ExternalLink,
  Shield,
  AlertTriangle,
  X,
  FileText,
  CheckCircle2,
  History,
  Copy
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore, DefaultSplitRule, ClosedWorkspaceSnapshot } from '@/lib/stores/useWorkspaceStore';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';
import { useUpdateUserProfile } from '@/features/auth';
import { useInviteCode, useJoinWorkspace, useUnlinkPartner, useUpdateWorkspace, useCreateWorkspace } from '@/features/workspaces';
import { useCreateSplitRule } from '@/features/transactions';
import { getDebtBalanceSummary } from '@/features/settlements';
import { getBudgets, updateBudget, BudgetDTO } from '@/features/budgets';
import { formatCurrency, capitalize } from '@/lib/utils';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { mutateAsync: updateProfile, isPending } = useUpdateUserProfile();
  const { data: inviteData } = useInviteCode();
  const { mutateAsync: joinWorkspaceMut, isPending: isJoining } = useJoinWorkspace();
  const { mutateAsync: unlinkWorkspaceMut, isPending: isUnlinking } = useUnlinkPartner();
  const { mutateAsync: updateWorkspaceMut } = useUpdateWorkspace();
  const { mutateAsync: createWorkspaceMut, isPending: isCreatingWorkspace } = useCreateWorkspace();
  const { mutateAsync: createSplitRuleMut } = useCreateSplitRule();

  const {
    rates,
    lastUpdated,
    isLoading: isLoadingRates,
    error: ratesError,
    setRate,
    fetchLiveRates,
    resetToDefaults,
    convert,
  } = useExchangeRateStore();

  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencyRate, setNewCurrencyRate] = useState('');
  const [rateSearch, setRateSearch] = useState('');
  const [rateFeedback, setRateFeedback] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const {
    hasPartner,
    partnerName,
    partnerEmail: storedPartnerEmail,
    lastClosedSnapshot,
    clearClosedSnapshot,
    defaultSplitRule,
    defaultUserPercentage,
    userMonthlyIncome = 0,
    partnerMonthlyIncome = 0,
    linkPartner,
    unlinkPartner,
    setDefaultSplitRule,
    setMonthlyIncomes,
    activeWorkspaceId,
    setActiveWorkspace,
    workspaces
  } = useWorkspaceStore();

  // Resolver el nombre real de la pareja desde los miembros del espacio si en el store dice 'pareja'
  const coupleWs = workspaces.find((w) => w.type === 'COUPLE' || (w.type as any) === 'couple');
  const partnerMember = coupleWs?.members?.find((m) => m.userEmail !== user?.email && m.userId !== user?.id);
  const rawPartnerName =
    partnerMember?.userName ||
    (partnerMember?.userEmail ? partnerMember.userEmail.split('@')[0] : null) ||
    (partnerName && partnerName.toLowerCase() !== 'pareja' && partnerName.toLowerCase() !== 'tu pareja' ? partnerName : null) ||
    'Pareja';
  const resolvedPartnerName = capitalize(rawPartnerName);

  const [fullName, setFullName] = useState(user?.fullName || 'Sin nombre');
  const [email] = useState(user?.email || 'no-email');
  const [currency, setCurrency] = useState(user?.preferredCurrency || 'PEN');
  const [coupleCurrency, setCoupleCurrency] = useState(coupleWs?.currency || 'PEN');

  useEffect(() => {
    if (coupleWs?.currency) {
      setCoupleCurrency(coupleWs.currency);
    }
  }, [coupleWs?.currency]);

  const [partnerInputName, setPartnerInputName] = useState(
    hasPartner && partnerName && partnerName.toLowerCase() !== 'pareja' ? capitalize(partnerName) : ''
  );

  useEffect(() => {
    if (hasPartner && resolvedPartnerName && resolvedPartnerName.toLowerCase() !== 'pareja') {
      setPartnerInputName(resolvedPartnerName);
    } else if (!hasPartner) {
      setPartnerInputName('');
    }
  }, [hasPartner, resolvedPartnerName]);

  // Si existe un snapshot residual en localStorage pero el usuario actual nunca ha tenido pareja o pertenecía a otra cuenta:
  useEffect(() => {
    if (lastClosedSnapshot && user?.email) {
      if (lastClosedSnapshot.userEmail && lastClosedSnapshot.userEmail.toLowerCase() !== user.email.toLowerCase()) {
        clearClosedSnapshot();
      }
    }
  }, [lastClosedSnapshot, user?.email, clearClosedSnapshot]);

  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [selectedRule, setSelectedRule] = useState<DefaultSplitRule>(defaultSplitRule);
  const [userPct, setUserPct] = useState(defaultUserPercentage);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  // Modal de Advertencia de Desvinculación y Snapshot de Corte
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [closingSnapshot, setClosingSnapshot] = useState<ClosedWorkspaceSnapshot | null>(null);

  // Modal de Confirmación de Cambio de Moneda y Migración de Presupuestos
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [pendingCurrencyData, setPendingCurrencyData] = useState<{
    targetScope: 'personal' | 'couple';
    newCurrency: string;
    oldCurrency: string;
    workspaceId: string;
  } | null>(null);
  const [affectedBudgets, setAffectedBudgets] = useState<BudgetDTO[]>([]);
  const [isMigratingBudgets, setIsMigratingBudgets] = useState(false);

  const effectiveCoupleWs = coupleWs || workspaces.find((w) => w.id === activeWorkspaceId && (w.type === 'COUPLE' || (w.type as any) === 'couple'));
  const isCoupleFullyJoined = Boolean(
    effectiveCoupleWs?.members && effectiveCoupleWs.members.length >= 2
  );
  const realInviteCode =
    effectiveCoupleWs?.invitationCode ||
    effectiveCoupleWs?.inviteCode ||
    inviteData?.code ||
    (storedPartnerEmail && storedPartnerEmail.startsWith('DUAL') ? storedPartnerEmail : '') ||
    '';

  const handleGenerateCoupleCode = async () => {
    setJoinError(null);
    setJoinSuccess(null);
    try {
      const created = await createWorkspaceMut({
        name: 'Espacio Compartido Pareja',
        description: 'Finanzas compartidas en pareja',
        type: 'COUPLE',
        currency: currency,
        ownerEmail: user?.email || email,
      });

      if (created?.id) {
        setActiveWorkspace(created.id, 'COUPLE');
        const codeToLink = created.invitationCode || created.inviteCode || 'Código Generado';
        linkPartner(partnerInputName || 'Pareja', codeToLink, selectedRule);
        queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        queryClient.invalidateQueries({ queryKey: ['inviteCode'] });
        setJoinSuccess(`¡Espacio de Pareja creado con éxito! Tu código es: ${codeToLink}`);
      }
    } catch (err: any) {
      console.error('Error al crear espacio pareja:', err);
      setJoinError(err?.message || 'Error al generar el espacio de pareja.');
    }
  };

  const handleJoinPartner = async () => {
    setJoinError(null);
    setJoinSuccess(null);
    if (!inviteCodeInput.trim()) {
      setJoinError('Ingresa el código de 8 caracteres de tu pareja (ej. DUALXXXX)');
      return;
    }

    try {
      const joined = await joinWorkspaceMut({
        code: inviteCodeInput.trim(),
        partnerEmail: user?.email || email,
      });

      if (joined?.id) {
        setActiveWorkspace(joined.id, 'COUPLE');
        linkPartner(partnerInputName || 'Pareja', inviteCodeInput.trim(), selectedRule);
        setJoinSuccess('¡Te has vinculado exitosamente al Espacio Compartido de tu pareja!');
      } else {
        linkPartner(partnerInputName || 'Pareja', inviteCodeInput.trim(), selectedRule);
        setJoinSuccess('Vinculado en modo local.');
      }
    } catch (err: any) {
      console.error('Error al unirse al espacio mediante código:', err);
      setJoinError(err?.message || 'Código de invitación inválido o no encontrado en el servidor.');
    }
  };

  const openUnlinkModalWithSnapshot = async () => {
    setJoinError(null);
    setJoinSuccess(null);
    setIsCheckingBalance(true);

    const currentUserEmail = user?.email || email || '';
    const coupleCurrency = currency || 'PEN';
    const partnerDisplay = capitalize(
      (resolvedPartnerName && resolvedPartnerName.toLowerCase() !== 'pareja' ? resolvedPartnerName : null) ||
      (partnerInputName && partnerInputName.toLowerCase() !== 'pareja' ? partnerInputName : null) ||
      (partnerName && partnerName.toLowerCase() !== 'pareja' ? partnerName : null) ||
      'tu pareja'
    );

    let calculatedSnapshot: ClosedWorkspaceSnapshot = {
      closedAt: new Date().toISOString(),
      workspaceId: activeWorkspaceId || '',
      userEmail: currentUserEmail,
      partnerName: partnerDisplay,
      partnerEmail: storedPartnerEmail || undefined,
      netBalance: 0,
      currency: coupleCurrency,
      debtorEmail: null,
      creditorEmail: null,
      isUserDebtor: false,
      isUserCreditor: false,
      totalSharedExpenses: 0,
      summaryText: 'Cuentas al día. No existían deudas compartidas pendientes al momento del cierre.',
    };

    try {
      if (activeWorkspaceId && /^[0-9a-fA-F-]{36}$/.test(activeWorkspaceId)) {
        const summary = await getDebtBalanceSummary(activeWorkspaceId);
        if (summary) {
          const net = summary.netBalance || 0;
          const isDebtor = Boolean(summary.debtorEmail && currentUserEmail.toLowerCase() === summary.debtorEmail.toLowerCase());
          const isCreditor = Boolean(summary.creditorEmail && currentUserEmail.toLowerCase() === summary.creditorEmail.toLowerCase());

          calculatedSnapshot = {
            closedAt: new Date().toISOString(),
            workspaceId: activeWorkspaceId,
            userEmail: currentUserEmail,
            partnerName: partnerDisplay,
            partnerEmail: storedPartnerEmail || undefined,
            netBalance: net,
            currency: coupleCurrency,
            debtorEmail: summary.debtorEmail || null,
            creditorEmail: summary.creditorEmail || null,
            isUserDebtor: isDebtor,
            isUserCreditor: isCreditor,
            totalSharedExpenses: summary.totalSharedExpenses || 0,
            summaryText: summary.summaryText || (net > 0 ? (isDebtor ? `Le debes ${formatCurrency(net, coupleCurrency)} a ${partnerDisplay}` : `${partnerDisplay} te debe ${formatCurrency(net, coupleCurrency)}`) : 'Cuentas equilibradas sin deudas pendientes.'),
          };
        }
      }
    } catch (err) {
      console.warn('No se pudo obtener el balance en vivo del backend antes de desvincular:', err);
    } finally {
      setIsCheckingBalance(false);
      setClosingSnapshot(calculatedSnapshot);
      setShowUnlinkModal(true);
    }
  };

  const confirmFinalUnlink = async () => {
    setJoinError(null);
    setJoinSuccess(null);
    const targetWsId = coupleWs?.id || activeWorkspaceId;
    try {
      if (targetWsId && /^[0-9a-fA-F-]{36}$/.test(targetWsId)) {
        await unlinkWorkspaceMut(targetWsId);
      }
    } catch (err) {
      console.error('Error al desvincular pareja en API:', err);
    }

    // Persistir el snapshot del corte de cuenta en el store local
    unlinkPartner(closingSnapshot || undefined);
    setShowUnlinkModal(false);
    queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    queryClient.invalidateQueries({ queryKey: ['debtBalanceSummary'] });
    queryClient.invalidateQueries({ queryKey: ['settlementsHistory'] });
    queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    setJoinSuccess('Te has desvinculado del espacio en pareja. Se generó un snapshot del balance de cierre.');
  };

  const handleAddCustomRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurrencyCode.trim() || !newCurrencyRate) return;
    const rateVal = parseFloat(newCurrencyRate);
    if (rateVal > 0) {
      setRate(newCurrencyCode.trim().toUpperCase(), rateVal);
      setRateFeedback(`Tasa para ${newCurrencyCode.trim().toUpperCase()} guardada exitosamente.`);
      setNewCurrencyCode('');
      setNewCurrencyRate('');
      setTimeout(() => setRateFeedback(null), 3000);
    }
  };

  const executeSaveSettings = async (
    convertedBudgetsMode?: 'CONVERT_RATE' | 'KEEP_AMOUNT' | null
  ) => {
    try {
      await updateProfile({
        fullName,
        preferredCurrency: currency,
      });

      // Actualizar moneda del workspace personal
      const personalWs = workspaces.find((w) => w.type === 'INDIVIDUAL' || (w.type as any) === 'personal');
      if (personalWs?.id) {
        try {
          await updateWorkspaceMut({
            id: personalWs.id,
            data: { currency },
          });
          useWorkspaceStore.getState().updateWorkspaceCurrency(personalWs.id, currency);
        } catch (pwErr) {
          console.error('Error al actualizar moneda en workspace personal:', pwErr);
        }
      }

      // Si existe un espacio de pareja, actualizar su moneda compartida
      if (coupleWs?.id) {
        try {
          await updateWorkspaceMut({
            id: coupleWs.id,
            data: { currency: coupleCurrency },
          });
          useWorkspaceStore.getState().updateWorkspaceCurrency(coupleWs.id, coupleCurrency);
        } catch (cwErr) {
          console.error('Error al actualizar moneda en workspace de pareja:', cwErr);
        }
      }

      // Si se confirmaron presupuestos para migrar
      if (convertedBudgetsMode && pendingCurrencyData && affectedBudgets.length > 0) {
        setIsMigratingBudgets(true);
        const { oldCurrency, newCurrency } = pendingCurrencyData;

        // Migrar presupuestos
        for (const b of affectedBudgets) {
          try {
            let newAmount = b.limitAmount;
            if (convertedBudgetsMode === 'CONVERT_RATE') {
              const converted = convert(b.limitAmount, oldCurrency, newCurrency);
              newAmount = parseFloat(converted.toFixed(2));
            }
            await updateBudget(b.id, {
              amount: newAmount,
              limitAmount: newAmount,
              currency: newCurrency,
            });
          } catch (migrErr) {
            console.error(`Error al migrar presupuesto ${b.id} a ${newCurrency}:`, migrErr);
          }
        }

        setIsMigratingBudgets(false);
      }

      // Calcular porcentaje efectivo antes de guardar en la API y en el store
      let effectivePct = userPct;
      if (selectedRule === 'PROPORTIONAL_INCOME') {
        const sum = (userMonthlyIncome || 0) + (partnerMonthlyIncome || 0);
        if (sum > 0) {
          effectivePct = Math.round(((userMonthlyIncome || 0) / sum) * 100);
        } else {
          effectivePct = 50;
        }
      } else if (selectedRule === 'EQUALLY') {
        effectivePct = 50;
      }

      // Si existe un espacio de pareja vinculado, guardar la regla en dicho espacio
      const coupleTargetWsId = coupleWs?.id || (hasPartner && activeWorkspaceId ? activeWorkspaceId : null);
      if (coupleTargetWsId && hasPartner) {
        try {
          const apiSplitType = selectedRule === 'PROPORTIONAL_INCOME' ? 'PROPORTIONAL'
            : selectedRule === 'EQUALLY' ? 'EQUAL'
              : selectedRule === 'PERCENTAGE' ? 'CUSTOM_PERCENTAGE'
                : 'EQUAL';

          const payload: any = {
            workspaceId: coupleTargetWsId,
            name: `Regla por defecto ${selectedRule}`,
            splitType: apiSplitType,
            partnerAPercentage: effectivePct,
            partnerBPercentage: 100 - effectivePct,
            isDefault: true,
          };

          await createSplitRuleMut(payload);
        } catch (ruleErr) {
          console.error('Error al guardar regla de división en API:', ruleErr);
        }
      }

      setDefaultSplitRule(selectedRule, effectivePct);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['debtBalanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });

      setShowCurrencyModal(false);
      setPendingCurrencyData(null);
      setAffectedBudgets([]);

      setSaveErrorMessage(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      console.error('Error al actualizar perfil:', err);
      setIsMigratingBudgets(false);
      setSaved(false);
      setSaveErrorMessage(err?.response?.data?.message || err?.message || 'Error al guardar los cambios en el servidor. Por favor, intenta nuevamente.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const personalWs = workspaces.find((w) => w.type === 'INDIVIDUAL' || (w.type as any) === 'personal');
    const oldPersonalCurrency = personalWs?.currency || user?.preferredCurrency || 'PEN';
    const oldCoupleCurrency = coupleWs?.currency || 'PEN';

    const personalChanged = personalWs?.id && currency !== oldPersonalCurrency;
    const coupleChanged = coupleWs?.id && coupleCurrency !== oldCoupleCurrency;

    // Si cambió la moneda de algún espacio, verificar si existen presupuestos
    if (personalChanged || coupleChanged) {
      const targetScope = personalChanged ? 'personal' : 'couple';
      const wsId = personalChanged ? personalWs!.id : coupleWs!.id;
      const oldCurr = personalChanged ? oldPersonalCurrency : oldCoupleCurrency;
      const newCurr = personalChanged ? currency : coupleCurrency;

      try {
        const existingBudgets = await getBudgets(wsId);
        const hasBudgets = existingBudgets && existingBudgets.length > 0;

        if (hasBudgets) {
          setPendingCurrencyData({
            targetScope,
            newCurrency: newCurr,
            oldCurrency: oldCurr,
            workspaceId: wsId,
          });
          setAffectedBudgets(existingBudgets || []);
          setShowCurrencyModal(true);
          return;
        }
      } catch (checkErr) {
        console.warn('No se pudieron precargar presupuestos:', checkErr);
      }
    }

    await executeSaveSettings(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-gray-800/60">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1">
            <Settings className="w-3 h-3" /> Preferencias del Sistema
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Configuración
        </h1>
        <p className="text-xs md:text-sm text-gray-400">
          Administra tu perfil, vínculos de pareja, moneda y tasas de cambio multimoneda.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {saveErrorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{saveErrorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveErrorMessage(null)}
              className="p-1 text-rose-400 hover:text-white rounded-lg hover:bg-rose-500/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Profile Card */}
        <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-800/60">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Perfil de Usuario</h2>
              <p className="text-xs text-gray-400">Tus datos personales y de cuenta</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Nombre Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/40 border border-gray-800/60 text-xs text-gray-400 outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Shared Space & Partner Link Card */}
        <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-white">Espacio Compartido & Pareja</h2>
                <p className="text-xs text-gray-400">Vincula a tu pareja y define reglas de división por defecto</p>
              </div>
            </div>

            {hasPartner && (
              <button
                type="button"
                onClick={openUnlinkModalWithSnapshot}
                disabled={isUnlinking || isCheckingBalance}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 disabled:opacity-50"
              >
                {isCheckingBalance ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verificando saldo...</span>
                  </>
                ) : (
                  <>
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Desvincular Pareja</span>
                  </>
                )}
              </button>
            )}
          </div>

          {joinError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {joinError}
            </div>
          )}

          {joinSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              {joinSuccess}
            </div>
          )}

          {hasPartner ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-emerald-400">Pareja Vinculada Activa</span>
                  <span className="text-xs text-gray-200 font-semibold">{resolvedPartnerName}</span>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>

              {/* Tu Código de Invitación - Solo visible si la pareja aún NO se ha unido (esperando segundo miembro) */}
              {!isCoupleFullyJoined && realInviteCode && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-purple-950/30 border border-indigo-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="block text-[11px] text-indigo-300 uppercase font-bold tracking-wider">
                      Tu Código de Invitación
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                      Esperando que tu pareja se una
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    Tu pareja debe ingresar este código de 8 caracteres en su cuenta para unirse a este espacio compartido:
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <code className="px-4 py-2 rounded-xl bg-gray-950 text-indigo-300 font-mono text-sm font-black border border-indigo-500/40 tracking-widest flex-1 text-center sm:text-left select-all">
                      {realInviteCode}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(realInviteCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Default Split Rules Configuration */}
              <div className="space-y-3 pt-2">
                <span className="block text-xs font-semibold text-gray-300">
                  Regla de División Predeterminada para los Gastos en Pareja
                </span>
                <p className="text-[11px] text-gray-400">
                  Al agregar un nuevo gasto compartido, esta será la regla seleccionada por defecto.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRule('PROPORTIONAL_INCOME')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${selectedRule === 'PROPORTIONAL_INCOME'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                  >
                    <span className="block font-bold text-xs">Por Proporción de Ingresos</span>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">
                      Calcula automáticamente según el sueldo de cada uno.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRule('EQUALLY')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${selectedRule === 'EQUALLY'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                  >
                    <span className="block font-bold text-xs">Equitativo (50% / 50%)</span>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">
                      Divide el monto a la mitad para ambos.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRule('PERCENTAGE')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${selectedRule === 'PERCENTAGE'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                  >
                    <span className="block font-bold text-xs">Porcentaje Personalizado</span>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">
                      Fija tu cuota en un porcentaje constante.
                    </span>
                  </button>
                </div>

                {selectedRule === 'PROPORTIONAL_INCOME' && (
                  <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-white">
                          Gestión Segura de Sueldos y Modo Privacidad
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                        Protección de Roles
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Los sueldos mensuales ahora se administran en la sección de <strong>Gastos Fijos</strong>, donde cada miembro edita únicamente su propio sueldo, se protege la privacidad mediante el <strong>Modo Confidencial</strong> y se sincroniza en tiempo real.
                    </p>

                    {(() => {
                      const uInc = userMonthlyIncome;
                      const pInc = partnerMonthlyIncome;
                      const total = uInc + pInc;
                      if (total > 0) {
                        const myPct = ((uInc / total) * 100).toFixed(1);
                        const partnerPct = ((pInc / total) * 100).toFixed(1);
                        return (
                          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-medium flex items-center justify-between">
                            <span>
                              Proporción activa: <strong>Tú {myPct}%</strong> | <strong>{resolvedPartnerName} {partnerPct}%</strong>
                            </span>
                            <span className="text-[10px] text-indigo-400 font-normal">Cálculo exacto</span>
                          </div>
                        );
                      }
                      return (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium">
                          Sin sueldos registrados aún. El sistema aplica <strong>50% / 50%</strong> hasta que registren sus ingresos.
                        </div>
                      );
                    })()}

                    <Link
                      href="/subscriptions"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold transition-all group"
                    >
                      <span>Ir a Gastos Fijos para configurar sueldos</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                )}

                {selectedRule === 'PERCENTAGE' && (
                  <div className="p-3 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-2">
                    <div className="flex justify-between text-xs text-gray-300 font-medium">
                      <span>Tu cuota fija: {userPct}%</span>
                      <span>{resolvedPartnerName}: {100 - userPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      value={userPct}
                      onChange={(e) => setUserPct(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-xs text-gray-400">
                Actualmente estás usando Dualis en <strong className="text-white">Modo Individual</strong>. Puedes invitar a tu pareja generando un código único o unirte al espacio existente de tu pareja ingresando su código:
              </p>

              {/* Snapshot Histórico de Último Corte de Cuenta (si existe y pertenece a este usuario) */}
              {lastClosedSnapshot && (!lastClosedSnapshot.userEmail || (user?.email && lastClosedSnapshot.userEmail.toLowerCase() === user.email.toLowerCase())) && (
                <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                        <History className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          Snapshot de Cierre con {lastClosedSnapshot.partnerName}
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-normal">
                            Corte Final
                          </span>
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          Generado el {new Date(lastClosedSnapshot.closedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={clearClosedSnapshot}
                      className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all text-xs"
                      title="Descartar este comprobante"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800/80">
                      <span className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">
                        Estado del Balance al Separarse
                      </span>
                      {lastClosedSnapshot.netBalance > 0 ? (
                        <div className="flex items-baseline gap-2">
                          <span className={`text-base font-extrabold ${lastClosedSnapshot.isUserDebtor ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {formatCurrency(lastClosedSnapshot.netBalance, lastClosedSnapshot.currency)}
                          </span>
                          <span className="text-[11px] text-gray-300 font-medium">
                            {lastClosedSnapshot.isUserDebtor ? `(Debías pagarle)` : `(Te debía saldar)`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Balance 100% Equilibrado (S/. 0.00)
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800/80">
                      <span className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">
                        Resumen Contable
                      </span>
                      <p className="text-[11px] text-gray-300 leading-snug">
                        {lastClosedSnapshot.summaryText}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 pt-1">
                    <FileText className="w-3 h-3 text-indigo-400" />
                    <span>Este snapshot es un comprobante inmutable para resolver transferencias pendientes fuera de la app.</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opción 1: Generar Código de Invitación */}
                <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-white">Opción 1: Invitar a mi Pareja</span>
                    <p className="text-[11px] text-gray-400">Crea un espacio de pareja y genera un código de invitación oficial de la API.</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">Nombre o Apodo de tu Pareja (Opcional)</label>
                    <input
                      type="text"
                      value={partnerInputName}
                      onChange={(e) => setPartnerInputName(e.target.value)}
                      placeholder="Ej. Sofía"
                      className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500 mb-3"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateCoupleCode}
                      disabled={isCreatingWorkspace}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isCreatingWorkspace ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" /> Generar Código de Invitación
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Opción 2: Unirme con Código de mi Pareja */}
                <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-white">Opción 2: Unirme con Código</span>
                    <p className="text-[11px] text-gray-400">Si tu pareja ya creó un espacio y te dio su código de 8 caracteres (ej. DUALXXXX).</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">Código de Invitación (8 Caracteres)</label>
                    <input
                      type="text"
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                      placeholder="Ej. DUAL7842"
                      maxLength={12}
                      className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-indigo-400 font-mono font-bold outline-none focus:border-emerald-500 mb-3 uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleJoinPartner}
                      disabled={isJoining}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isJoining ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <HeartHandshake className="w-3.5 h-3.5" /> Unirme al Espacio de Pareja
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Regional Preferences & Base Currencies */}
        <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-800/60">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Monedas Base de los Espacios</h2>
              <p className="text-xs text-gray-400">Define en qué divisa se consolidan tus cuentas personales y en pareja</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Moneda Personal */}
            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-bold text-white">Moneda Base Personal</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                  Individual
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-snug">
                Divisa principal en la que se consolidan tus reportes, métricas del Dashboard, presupuestos individuales y metas de ahorro.
              </p>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="PEN">PEN (S/) - Sol Peruano</option>
                <option value="USD">USD ($) - Dólar Estadounidense</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="COP">COP ($) - Peso Colombiano</option>
                <option value="MXN">MXN ($) - Peso Mexicano</option>
                <option value="ARS">ARS ($) - Peso Argentino</option>
                <option value="CLP">CLP ($) - Peso Chileno</option>
                <option value="BRL">BRL (R$) - Real Brasileño</option>
                <option value="GBP">GBP (£) - Libra Esterlina</option>
                <option value="CAD">CAD ($) - Dólar Canadiense</option>
              </select>
            </div>

            {/* Moneda de Pareja */}
            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-bold text-white">Moneda Base de Pareja</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Compartido
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-snug">
                {coupleWs ? (
                  <>Divisa unificada en la que se calculan los balances totales, gastos comunes y la <strong>liquidación neta de deudas</strong>.</>
                ) : (
                  <>Moneda que adoptará el espacio compartido para reportes y liquidaciones una vez que te vincules con tu pareja.</>
                )}
              </p>
              <select
                value={coupleCurrency}
                onChange={(e) => setCoupleCurrency(e.target.value)}
                className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-emerald-300 font-semibold outline-none focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="PEN">PEN (S/) - Sol Peruano</option>
                <option value="USD">USD ($) - Dólar Estadounidense</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="COP">COP ($) - Peso Colombiano</option>
                <option value="MXN">MXN ($) - Peso Mexicano</option>
                <option value="ARS">ARS ($) - Peso Argentino</option>
                <option value="CLP">CLP ($) - Peso Chileno</option>
                <option value="BRL">BRL (R$) - Real Brasileño</option>
                <option value="GBP">GBP (£) - Libra Esterlina</option>
                <option value="CAD">CAD ($) - Dólar Canadiense</option>
              </select>
            </div>
          </div>

          {/* Nota aclaratoria sobre cuentas multimoneda independientes */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
            <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-1 text-xs">
              <span className="font-bold text-indigo-200 block">Independencia de Monedas en Cuentas y Movimientos</span>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Esta configuración define la <strong>moneda de consolidación</strong> (para dashboards, totales y liquidaciones). Al crear una nueva <strong>cuenta bancaria, billetera o tarjeta</strong> en la sección de Cuentas, puedes elegir de forma totalmente independiente su propia moneda (ej. puedes tener cuentas en USD y PEN dentro del mismo espacio). El sistema convertirá automáticamente los saldos usando las tasas referenciales configuradas abajo.
              </p>
            </div>
          </div>
        </div>

        {/* Multi-currency & Exchange Rates Manager */}
        <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-white">Tipos de Cambio Referenciales</h2>
                <p className="text-xs text-gray-400">
                  Tasas relativas a 1 USD para convertir cuentas en moneda extranjera al total de tu espacio.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchLiveRates}
                disabled={isLoadingRates}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRates ? 'animate-spin' : ''}`} />
                <span>{isLoadingRates ? 'Actualizando...' : 'Actualizar en Vivo'}</span>
              </button>
              <button
                type="button"
                onClick={resetToDefaults}
                className="px-3 py-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white text-xs font-medium transition-all cursor-pointer"
              >
                Restablecer
              </button>
            </div>
          </div>

          {rateFeedback && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
              {rateFeedback}
            </div>
          )}

          {ratesError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{ratesError}</span>
            </div>
          )}

          {lastUpdated && (
            <div className="text-[11px] text-gray-500">
              Última actualización de tasas: {new Date(lastUpdated).toLocaleString()}
            </div>
          )}

          {/* Buscador y contenedor scrolleable de tasas */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span className="text-xs text-gray-400">
                {Object.keys(rates).length} monedas registradas
              </span>
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar moneda (ej. EUR, PEN)..."
                  value={rateSearch}
                  onChange={(e) => setRateSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-gray-950/70 border border-gray-800 text-xs text-white placeholder:text-gray-500 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto pr-1.5 custom-scrollbar border border-gray-800/80 rounded-2xl p-2 bg-gray-950/40">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {Object.entries(rates)
                  .filter(([code]) => code.toLowerCase().includes(rateSearch.trim().toLowerCase()))
                  .map(([code, val]) => (
                  <div
                    key={code}
                    className="p-2.5 rounded-xl bg-gray-900/90 border border-gray-800 space-y-1 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{code}</span>
                      <span className="text-[10px] text-gray-500">vs 1 USD</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="any"
                        value={val}
                        onChange={(e) => {
                          const num = parseFloat(e.target.value);
                          if (!isNaN(num) && num > 0) {
                            setRate(code, num);
                          }
                        }}
                        className="w-full bg-gray-950 border border-gray-800/80 rounded-lg px-2 py-1 text-xs text-emerald-400 font-mono font-semibold focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Añadir nueva divisa personalizada */}
          <div className="pt-3 border-t border-gray-800/80">
            <span className="block text-xs font-semibold text-gray-300 mb-2">
              Agregar o personalizar otra divisa:
            </span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="CÓDIGO (EJ. AUD, CHF, JPY)"
                maxLength={4}
                value={newCurrencyCode}
                onChange={(e) => setNewCurrencyCode(e.target.value.toUpperCase())}
                className="flex-1 sm:w-44 min-w-[130px] px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white uppercase outline-none focus:border-indigo-500"
              />
              <input
                type="number"
                step="any"
                placeholder="Tasa vs 1 USD (ej. 1.55)"
                value={newCurrencyRate}
                onChange={(e) => setNewCurrencyRate(e.target.value)}
                className="flex-1 sm:w-44 min-w-[130px] px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCustomRate}
                className="w-full sm:w-auto shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Divisa
              </button>
            </div>
          </div>
        </div>

        {/* Submit Save */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Guardado con éxito</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal de Advertencia de Desvinculación y Snapshot de Corte */}
      {showUnlinkModal && closingSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-gray-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
            {/* Header del Modal */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Confirmar Desvinculación de {closingSnapshot.partnerName}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Corte de cuenta y advertencia de saldo pendiente
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUnlinkModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alerta de Balance Actual y Corte de Cuenta */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gray-950/80 border border-gray-800 space-y-3">
                <span className="block text-[11px] uppercase font-semibold text-gray-400">
                  Snapshot de Corte de Cuenta (Balance en Vivo)
                </span>

                {closingSnapshot.netBalance > 0 ? (
                  <div className={`p-3.5 rounded-xl border ${closingSnapshot.isUserDebtor ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs font-semibold">
                        {closingSnapshot.isUserDebtor ? `Debes saldarle a ${closingSnapshot.partnerName}:` : `${closingSnapshot.partnerName} te debe saldar:`}
                      </span>
                      <span className="text-base font-black">
                        {formatCurrency(closingSnapshot.netBalance, closingSnapshot.currency)}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      {closingSnapshot.summaryText}
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div className="text-xs font-medium">
                      <span>¡Cuentas al día! No existen deudas compartidas pendientes entre tú y {closingSnapshot.partnerName}.</span>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-gray-400 space-y-1.5 pt-1">
                  <p className="flex items-start gap-1.5">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>Tus finanzas y cuentas personales quedarán 100% intactas y privadas.</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>El espacio compartido quedará congelado y se guardará un <strong>Snapshot Inmutable</strong> para cualquier ajuste externo.</span>
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  Esta acción es unilateral e inmediata. Tu sesión cambiará de inmediato al <strong>Espacio Personal</strong>.
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUnlinkModal(false)}
                disabled={isUnlinking}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmFinalUnlink}
                disabled={isUnlinking}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUnlinking ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Desvinculando...</span>
                  </>
                ) : (
                  <>
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Confirmar y Desvincular</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cambio de Moneda y Migración de Presupuestos */}
      {showCurrencyModal && pendingCurrencyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative w-full max-w-lg bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => {
                setShowCurrencyModal(false);
                setPendingCurrencyData(null);
                setAffectedBudgets([]);
              }}
              disabled={isMigratingBudgets}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Cambio de Moneda Base</h3>
                <p className="text-xs text-gray-400">
                  {pendingCurrencyData.targetScope === 'personal'
                    ? 'Espacio Personal'
                    : 'Espacio Compartido de Pareja'}{' '}
                  • De {pendingCurrencyData.oldCurrency} a {pendingCurrencyData.newCurrency}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <p className="text-xs text-gray-300 leading-relaxed">
                Tienes{' '}
                <strong>{affectedBudgets.length} presupuesto(s)</strong> en este espacio.
                Los nuevos presupuestos se crearán en <strong>{pendingCurrencyData.newCurrency}</strong>.
                Tus metas de ahorro y cuentas bancarias mantendrán de forma intacta su propia moneda configurada.
                ¿Cómo deseas proceder con los presupuestos existentes?
              </p>

              {/* Lista breve de elementos afectados */}
              <div className="max-h-44 overflow-y-auto space-y-2 p-3 rounded-2xl bg-gray-900/80 border border-gray-800/80 divide-y divide-gray-800/50">
                {affectedBudgets.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-xs pt-1.5 first:pt-0">
                    <span className="text-gray-300 font-medium truncate max-w-[190px]">
                      📊 {b.name || b.categoryName || 'Presupuesto'}
                    </span>
                    <span className="text-gray-400 font-mono text-[11px]">
                      {formatCurrency(b.limitAmount, pendingCurrencyData.oldCurrency)}
                      <span className="text-indigo-400 mx-1">➔</span>
                      {formatCurrency(
                        convert(b.limitAmount, pendingCurrencyData.oldCurrency, pendingCurrencyData.newCurrency),
                        pendingCurrencyData.newCurrency
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Las 2 Opciones Disponibles */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  disabled={isMigratingBudgets}
                  onClick={() => executeSaveSettings('CONVERT_RATE')}
                  className="w-full text-left p-3.5 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 hover:bg-indigo-600/25 hover:border-indigo-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-indigo-300 group-hover:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Opción 1: Convertir montos con Tipo de Cambio (Recomendado)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                      Automático
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    Recalcula los límites de gastos para mantener el valor adquisitivo equivalente en {pendingCurrencyData.newCurrency} según la tasa actual.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={isMigratingBudgets}
                  onClick={() => executeSaveSettings('KEEP_AMOUNT')}
                  className="w-full text-left p-3.5 rounded-2xl bg-gray-900/90 border border-gray-800 hover:border-gray-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-200 group-hover:text-white">
                      Opción 2: Mantener valores numéricos
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 font-medium">
                      Manual
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    Conserva el número exacto del límite (ej. 1,000 {pendingCurrencyData.oldCurrency} pasa a 1,000 {pendingCurrencyData.newCurrency}) y te permite ajustarlo manualmente en Presupuestos.
                  </p>
                </button>
              </div>

              {isMigratingBudgets && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Actualizando presupuestos a {pendingCurrencyData.newCurrency}...</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-800/80">
              <button
                type="button"
                onClick={() => {
                  setShowCurrencyModal(false);
                  setPendingCurrencyData(null);
                  setAffectedBudgets([]);
                }}
                disabled={isMigratingBudgets}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
