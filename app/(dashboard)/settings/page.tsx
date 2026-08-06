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
  Check
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/useAuthStore';

export default function SettingsPage() {
  const { user } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || 'Jorge Linares');
  const [email] = useState(user?.email || 'jorge@ejemplo.com');
  const [currency, setCurrency] = useState('PEN');
  const [partnerEmail, setPartnerEmail] = useState('sofia@ejemplo.com');
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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

        {/* Shared Space & Partner Link */}
        <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-800/60">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Espacio Compartido en Pareja</h2>
              <p className="text-xs text-gray-400">Vinculación para sincronización de gastos</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Correo de tu Pareja Vinculada
            </label>
            <div className="flex items-center gap-3">
              <input
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="pareja@ejemplo.com"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-white outline-none focus:border-emerald-500 transition-all"
              />
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 shrink-0 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Vinculado
              </span>
            </div>
          </div>
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            {saved ? (
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
