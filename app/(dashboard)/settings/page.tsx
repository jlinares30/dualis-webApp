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
  History
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore, DefaultSplitRule, ClosedWorkspaceSnapshot } from '@/lib/stores/useWorkspaceStore';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';
import { useUpdateUserProfile } from '@/features/auth';
import { useInviteCode, useJoinWorkspace, useUnlinkPartner, useUpdateWorkspace, useCreateWorkspace } from '@/features/workspaces';
import { useCreateSplitRule } from '@/features/transactions';
import { getDebtBalanceSummary } from '@/features/settlements';
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
    setRate,
    fetchLiveRates,
    resetToDefaults,
  } = useExchangeRateStore();

  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencyRate, setNewCurrencyRate] = useState('');
  const [rateSearch, setRateSearch] = useState('');
  const [rateFeedback, setRateFeedback] = useState<string | null>(null);

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

  const realInviteCode = inviteData?.code || '';

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
        setJoinSuccess('Espacio de Pareja creado con éxito. Comparte el código con tu pareja.');
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        fullName,
        preferredCurrency: currency,
      });

      if (activeWorkspaceId) {
        try {
          await updateWorkspaceMut({
            id: activeWorkspaceId,
            data: { currency },
          });
          useWorkspaceStore.getState().updateWorkspaceCurrency(activeWorkspaceId, currency);
        } catch (wErr) {
          console.error('Error al actualizar workspace en API:', wErr);
        }

        if (hasPartner) {
          try {
            const apiSplitType = selectedRule === 'PROPORTIONAL_INCOME' ? 'PROPORTIONAL'
              : selectedRule === 'EQUALLY' ? 'EQUAL'
                : selectedRule === 'PERCENTAGE' ? 'CUSTOM_PERCENTAGE'
                  : 'EQUAL';

            const payload: any = {
              workspaceId: activeWorkspaceId,
              name: `Regla por defecto ${selectedRule}`,
              splitType: apiSplitType,
              partnerAPercentage: selectedRule === 'EQUALLY' ? 50 : userPct,
              partnerBPercentage: selectedRule === 'EQUALLY' ? 50 : 100 - userPct,
              isDefault: true,
            };

            await createSplitRuleMut(payload);
          } catch (ruleErr) {
            console.error('Error al guardar regla de división en API:', ruleErr);
          }
        }
      }

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

      setDefaultSplitRule(selectedRule, effectivePct);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['debtBalanceSummary'] });

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      setDefaultSplitRule(selectedRule, userPct);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
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

              {/* Tu Código de Invitación */}
              {realInviteCode && (
                <div className="p-4 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-2">
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold">Código de Invitación de este Espacio</span>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-1.5 rounded-xl bg-gray-950 text-indigo-400 font-mono text-xs font-bold border border-gray-800 flex-1">
                      {realInviteCode}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(realInviteCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-semibold hover:bg-indigo-600/30 transition-all cursor-pointer"
                    >
                      {copied ? '¡Copiado!' : 'Copiar Código'}
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

              {/* Snapshot Histórico de Último Corte de Cuenta (si existe) */}
              {lastClosedSnapshot && (
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

        {/* Regional Preferences & Base Currency */}
        <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-800/60">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Moneda Base del Espacio</h2>
              <p className="text-xs text-gray-400">Moneda en la que se consolidan y muestran los totales</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Moneda Principal
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500 transition-all cursor-pointer"
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
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Código (ej. AUD, CHF, JPY)"
                maxLength={4}
                value={newCurrencyCode}
                onChange={(e) => setNewCurrencyCode(e.target.value.toUpperCase())}
                className="w-full sm:w-44 px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white uppercase outline-none focus:border-indigo-500"
              />
              <input
                type="number"
                step="any"
                placeholder="Tasa vs 1 USD (ej. 1.55)"
                value={newCurrencyRate}
                onChange={(e) => setNewCurrencyRate(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCustomRate}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
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
    </div>
  );
}
