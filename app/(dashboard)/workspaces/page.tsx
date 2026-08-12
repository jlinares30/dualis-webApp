'use client';

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Copy, 
  Check, 
  ShieldCheck, 
  HeartHandshake, 
  Sparkles,
  UserCheck,
  Crown,
  AlertCircle,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useWorkspaceDetails, useInviteCode, useJoinWorkspace, useWorkspaces } from '@/hooks/useWorkspaces';

export default function WorkspacesPage() {
  const { user } = useAuthStore();
  const { 
    workspaces, 
    activeWorkspaceId, 
    setActiveWorkspace,
    partnerName,
    linkPartner
  } = useWorkspaceStore();

  // Fetch all user workspaces and details for active workspace
  useWorkspaces();
  const { data: workspaceDetails, isLoading: isLoadingDetails } = useWorkspaceDetails(activeWorkspaceId);
  const { data: inviteData } = useInviteCode();
  const { mutateAsync: joinWorkspaceMut, isPending: isJoining } = useJoinWorkspace();

  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  const activeWs = workspaceDetails || workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const isCouple = activeWs?.type === 'COUPLE' || (activeWs?.type as any) === 'couple';
  const effectiveInviteCode = activeWs?.invitationCode || activeWs?.inviteCode || inviteData?.code || '';

  const handleCopyCode = () => {
    if (!effectiveInviteCode) return;
    navigator.clipboard.writeText(effectiveInviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccess(null);

    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError('Ingresa un código de invitación de 8 caracteres');
      return;
    }

    try {
      const joined = await joinWorkspaceMut({
        code: cleanCode,
        partnerEmail: user?.email || '',
      });

      if (joined?.id) {
        setActiveWorkspace(joined.id, 'COUPLE');
        linkPartner('Pareja', cleanCode);
        setJoinSuccess('¡Te has unido exitosamente al Espacio Compartido de tu pareja!');
        setJoinCode('');
      } else {
        setJoinSuccess('Vinculación registrada correctamente.');
        setJoinCode('');
      }
    } catch (err: any) {
      console.error('Error al unirse al espacio:', err);
      setJoinError(err?.message || 'Código de invitación inválido o no encontrado en el servidor.');
    }
  };

  const membersList = activeWs?.members || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      {/* Header */}
      <div className="pb-4 border-b border-gray-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1">
              <Users className="w-3 h-3" /> Espacios & Pareja
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Gestión de Espacios Financieros
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Administra tus espacios de trabajo personales y compartidos en tiempo real.
          </p>
        </div>
      </div>

      {/* Workspace Selector Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Tus Espacios de Trabajo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeWorkspaceId;
            const isWsCouple = ws.type === 'COUPLE' || (ws.type as any) === 'couple';

            return (
              <div
                key={ws.id}
                onClick={() => setActiveWorkspace(ws.id, ws.type)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isActive
                    ? 'bg-gradient-to-br from-indigo-950/60 to-gray-900 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                    : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${
                      isWsCouple 
                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    }`}>
                      {isWsCouple ? <HeartHandshake className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{ws.name}</h3>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">
                        {isWsCouple ? 'Pareja' : 'Individual'}
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Activo
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400 line-clamp-1">
                  {ws.description || (isWsCouple ? 'Espacio compartido de pareja' : 'Espacio de finanzas individuales')}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Active Workspace Card */}
      {activeWs && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-gray-900 to-purple-950/30 border border-indigo-500/20 p-6 md:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                  isCouple 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  {isCouple ? <HeartHandshake className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                  Espacio Activo: {isCouple ? 'Pareja' : 'Individual'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white">
                {activeWs.name}
              </h2>
              <p className="text-xs text-gray-400 max-w-lg">
                {activeWs.description || (isCouple 
                  ? 'Gastos y presupuestos sincronizados en tiempo real entre integrantes.' 
                  : 'Gestión exclusiva de finanzas personales.'
                )}
              </p>
            </div>

            {/* Copy Invite Code Box (Only if COUPLE workspace) */}
            {isCouple && (
              <div className="w-full md:w-auto bg-gray-900/90 border border-gray-800 p-4 rounded-2xl space-y-2">
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">Código de Invitación Oficial</span>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-1.5 rounded-xl bg-gray-950 text-indigo-400 font-mono text-xs font-bold border border-gray-800 uppercase">
                    {effectiveInviteCode || 'Generando...'}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    disabled={!effectiveInviteCode}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                    title="Copiar código"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List (2 cols) */}
        <div className="lg:col-span-2 rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Miembros del Espacio</h3>
                <p className="text-xs text-gray-400">Integrantes con acceso a este espacio</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-400 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
              {membersList.length > 0 ? `${membersList.length} Integrantes` : '1 Integrante'}
            </span>
          </div>

          {isLoadingDetails ? (
            <div className="py-6 text-center text-xs text-gray-500">Cargando integrantes...</div>
          ) : membersList.length === 0 ? (
            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{user?.fullName || user?.email}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">
                      <Crown className="w-3 h-3" /> Creador
                    </span>
                    <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-md">Tú</span>
                  </div>
                  <span className="text-xs text-gray-400">{user?.email}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {membersList.map((member: any) => {
                const isMe = member.userEmail?.toLowerCase() === user?.email?.toLowerCase();
                const isOwner = member.role === 'OWNER';
                const memberInitial = (member.userName || member.userEmail || 'U').charAt(0).toUpperCase();

                return (
                  <div
                    key={member.id || member.userEmail}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {memberInitial}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">
                            {member.userName || member.userEmail}
                          </span>
                          {isOwner && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">
                              <Crown className="w-3 h-3" /> Creador
                            </span>
                          )}
                          {!isOwner && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              Pareja
                            </span>
                          )}
                          {isMe && (
                            <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-md">Tú</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{member.userEmail}</span>
                      </div>
                    </div>

                    <div className="text-right text-xs text-gray-400">
                      <span>{member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('es-PE', { month: 'short', year: 'numeric' }) : 'Conectado'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Join Space Box (1 col) */}
        <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-800/60">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Unirse a un Espacio</h3>
              <p className="text-xs text-gray-400">Ingresa un código de pareja</p>
            </div>
          </div>

          {joinError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{joinError}</span>
            </div>
          )}

          {joinSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{joinSuccess}</span>
            </div>
          )}

          <form onSubmit={handleJoinSpace} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Código de Invitación (8 Caracteres)
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Ej. DUAL8X9P"
                maxLength={12}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-indigo-400 placeholder-gray-500 outline-none focus:border-purple-500 transition-all font-mono uppercase font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={isJoining}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isJoining ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Vincular Código</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
