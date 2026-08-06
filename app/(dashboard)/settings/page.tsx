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
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore, DefaultSplitRule } from '@/lib/stores/useWorkspaceStore';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { 
    hasPartner, 
    partnerName, 
    partnerEmail: storedPartnerEmail, 
    defaultSplitRule, 
    defaultUserPercentage,
    linkPartner, 
    unlinkPartner,
    setDefaultSplitRule 
  } = useWorkspaceStore();

  const [fullName, setFullName] = useState(user?.fullName || 'Jorge Linares');
  const [email] = useState(user?.email || 'jorge@ejemplo.com');
  const [currency, setCurrency] = useState('PEN');

  // Partner linkage form state
  const [partnerInputName, setPartnerInputName] = useState(partnerName || 'Sofía Martínez');
  const [partnerInputEmail, setPartnerInputEmail] = useState(storedPartnerEmail || 'sofia@ejemplo.com');
  const [selectedRule, setSelectedRule] = useState<DefaultSplitRule>(defaultSplitRule);
  const [userPct, setUserPct] = useState(defaultUserPercentage);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setDefaultSplitRule(selectedRule, userPct);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTogglePartner = () => {
    if (hasPartner) {
      unlinkPartner();
    } else {
      linkPartner(partnerInputName || 'Pareja', partnerInputEmail || 'pareja@ejemplo.com', selectedRule);
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

            <button
              type="button"
              onClick={handleTogglePartner}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                hasPartner
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
              }`}
            >
              {hasPartner ? (
                <>
                  <UserMinus className="w-3.5 h-3.5" /> Desvincular Pareja
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" /> Vincular Pareja
                </>
              )}
            </button>
          </div>

          {hasPartner ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-emerald-400">Pareja Vinculada Activa</span>
                  <span className="text-xs text-gray-200">{partnerInputName} ({partnerInputEmail})</span>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>

              {/* Default Split Rules Configuration */}
              <div className="space-y-3 pt-2">
                <span className="block text-xs font-semibold text-gray-300">
                  Regla de División Predeterminada para los Gastos en Pareja
                </span>
                <p className="text-[11px] text-gray-400">
                  Al agregar un nuevo gasto compartido, esta será la regla seleccionada por defecto (podrás modificarla por cada gasto si lo requieres).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRule('PROPORTIONAL_INCOME')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedRule === 'PROPORTIONAL_INCOME'
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
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedRule === 'EQUALLY'
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
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedRule === 'PERCENTAGE'
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
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Actualmente estás usando Dualis en <strong className="text-white">Modo 100% Personal</strong>. Si deseas sincronizar cuentas con tu pareja, ingresa sus datos a continuación y presiona Vincular:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre de la Pareja</label>
                  <input
                    type="text"
                    value={partnerInputName}
                    onChange={(e) => setPartnerInputName(e.target.value)}
                    placeholder="Ej. Sofía Martínez"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-white outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Correo de la Pareja</label>
                  <input
                    type="email"
                    value={partnerInputEmail}
                    onChange={(e) => setPartnerInputEmail(e.target.value)}
                    placeholder="sofia@ejemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-white outline-none focus:border-emerald-500 transition-all"
                  />
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
