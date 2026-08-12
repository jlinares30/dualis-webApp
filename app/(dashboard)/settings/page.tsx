'use client';

import React, { useState } from 'react';
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
  Percent
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore, DefaultSplitRule } from '@/lib/stores/useWorkspaceStore';
import { useUpdateUserProfile } from '@/hooks/useUserProfile';
import { useInviteCode, useJoinWorkspace, useUnlinkPartner, useUpdateWorkspace, useCreateWorkspace } from '@/hooks/useWorkspaces';
import { useCreateSplitRule } from '@/hooks/useSplitRules';

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
    hasPartner,
    partnerName,
    partnerEmail: storedPartnerEmail,
    defaultSplitRule,
    defaultUserPercentage,
    linkPartner,
    unlinkPartner,
    setDefaultSplitRule,
    activeWorkspaceId,
    setActiveWorkspace
  } = useWorkspaceStore();

  const [fullName, setFullName] = useState(user?.fullName || 'Sin nombre');
  const [email] = useState(user?.email || 'no-email');
  const [currency, setCurrency] = useState(user?.preferredCurrency || 'PEN');

  // Partner linkage form state
  const [partnerInputName, setPartnerInputName] = useState(partnerName || '');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [selectedRule, setSelectedRule] = useState<DefaultSplitRule>(defaultSplitRule);
  const [userPct, setUserPct] = useState(defaultUserPercentage);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

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

  const handleUnlinkPartner = async () => {
    setJoinError(null);
    setJoinSuccess(null);
    try {
      if (activeWorkspaceId) {
        await unlinkWorkspaceMut(activeWorkspaceId);
      }
    } catch (err) {
      console.error('Error al desvincular pareja en API:', err);
    }
    unlinkPartner();
    setJoinSuccess('Te has desvinculado del espacio en pareja.');
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

            if (apiSplitType === 'PROPORTIONAL') {
              payload.partnerAIncome = userPct;
              payload.partnerBIncome = 100 - userPct;
            }

            await createSplitRuleMut(payload);
          } catch (ruleErr) {
            console.error('Error al guardar regla de división en API:', ruleErr);
          }
        }
      }

      setDefaultSplitRule(selectedRule, userPct);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['debtBalanceSummary'] });

      setDefaultSplitRule(selectedRule, userPct);
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
          Administra tu perfil, vínculos de pareja y preferencias de moneda.
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
                onClick={handleUnlinkPartner}
                disabled={isUnlinking}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
              >
                <UserMinus className="w-3.5 h-3.5" /> Desvincular Pareja
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
                  <span className="text-xs text-gray-200">{partnerInputName}</span>
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

                {selectedRule === 'PERCENTAGE' && (
                  <div className="p-3 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-2">
                    <div className="flex justify-between text-xs text-gray-300 font-medium">
                      <span>Tu cuota fija: {userPct}%</span>
                      <span>Pareja: {100 - userPct}%</span>
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

        {/* Regional Preferences */}
        <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-800/60">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Preferencias de Moneda</h2>
              <p className="text-xs text-gray-400">Moneda principal para el cálculo del Dashboard</p>
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
            </select>
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
    </div>
  );
}
