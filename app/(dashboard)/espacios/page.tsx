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
  Crown
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';

interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'PARTNER';
  joinedDate: string;
  isCurrentUser: boolean;
}

const mockMembers: WorkspaceMember[] = [
  {
    id: 'm-1',
    name: 'Jorge Linares',
    email: 'jorge@ejemplo.com',
    role: 'OWNER',
    joinedDate: 'Enero 2026',
    isCurrentUser: true,
  },
  {
    id: 'm-2',
    name: 'Sofía Martínez',
    email: 'sofia@ejemplo.com',
    role: 'PARTNER',
    joinedDate: 'Febrero 2026',
    isCurrentUser: false,
  },
];

export default function WorkspacesPage() {
  const { user } = useAuthStore();
  const [inviteCode] = useState('DUALIS-7842-SOFIA');
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    setJoinedSuccess(true);
    setTimeout(() => setJoinedSuccess(false), 3000);
  };

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
            Gestión de Espacio Compartido
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Administra los integrantes de tu grupo y vincula a tu pareja mediante un código de invitación.
          </p>
        </div>
      </div>

      {/* Main Couple Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-gray-900 to-purple-950/30 border border-indigo-500/20 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                <HeartHandshake className="w-3 h-3" /> Espacio Activo: Pareja
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">
              Espacio Sincronizado de Finanzas
            </h2>
            <p className="text-xs text-gray-400">
              Actualmente estás compartiendo gastos y balances en tiempo real con <strong className="text-white">Sofía Martínez</strong>.
            </p>
          </div>

          {/* Copy Invite Code Box */}
          <div className="w-full md:w-auto bg-gray-900/90 border border-gray-800 p-4 rounded-2xl space-y-2">
            <span className="block text-[10px] text-gray-400 uppercase font-semibold">Código de Invitación del Espacio</span>
            <div className="flex items-center gap-2">
              <code className="px-3 py-1.5 rounded-xl bg-gray-950 text-indigo-400 font-mono text-xs font-bold border border-gray-800">
                {inviteCode}
              </code>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                title="Copiar código"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

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
                <p className="text-xs text-gray-400">Personas conectadas a este espacio</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-400 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
              2 Integrantes
            </span>
          </div>

          <div className="space-y-3">
            {mockMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{member.name}</span>
                      {member.role === 'OWNER' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">
                          <Crown className="w-3 h-3" /> Creador
                        </span>
                      )}
                      {member.isCurrentUser && (
                        <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-md">Tú</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{member.email}</span>
                  </div>
                </div>

                <div className="text-right text-xs text-gray-400">
                  <span>Unido en {member.joinedDate}</span>
                </div>
              </div>
            ))}
          </div>
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

          <form onSubmit={handleJoinSpace} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Código de Invitación
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Ej. DUALIS-XXXX-XXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {joinedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>¡Unido con Éxito!</span>
                </>
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
