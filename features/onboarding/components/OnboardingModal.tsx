'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  DollarSign, 
  Building2, 
  CreditCard,
  PiggyBank
} from 'lucide-react';
import { submitOnboarding, OnboardingPayload } from '@/lib/auth';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { getUserWorkspaces } from '@/features/workspaces/services/workspaces-service';
import { useQueryClient } from '@tanstack/react-query';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const { user, setUser } = useAuthStore();
  const { setWorkspaces, setActiveWorkspace } = useWorkspaceStore();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [currency, setCurrency] = useState(user?.preferredCurrency || 'USD');
  const [accountName, setAccountName] = useState('Cuenta de Ahorros Principal');
  const [accountType, setAccountType] = useState('SAVINGS');
  const [initialBalance, setInitialBalance] = useState<string>('500');

  if (!isOpen) return null;

  const handleFinish = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload: OnboardingPayload = {
        baseCurrency: currency,
        workspaceMode: 'INDIVIDUAL',
        accountName: accountName.trim() || 'Cuenta Principal',
        accountType,
        initialBalance: parseFloat(initialBalance) || 0,
      };

      const updatedProfile = await submitOnboarding(payload);
      if (user) {
        setUser({
          ...user,
          preferredCurrency: updatedProfile.preferredCurrency,
          onboardingCompleted: true,
        });
      }

      // Obtener y sincronizar inmediatamente los workspaces actualizados
      try {
        const freshWorkspaces = await getUserWorkspaces(user?.email || undefined);
        if (freshWorkspaces && freshWorkspaces.length > 0) {
          setWorkspaces(freshWorkspaces);
          const individualWs = freshWorkspaces.find((w) => w.type === 'INDIVIDUAL' || (w.type as any) === 'personal') || freshWorkspaces[0];
          setActiveWorkspace(individualWs.id, 'personal');
        }
      } catch (wsErr) {
        console.warn('No se pudo refrescar workspaces de inmediato:', wsErr);
      }

      // Invalidar todas las consultas relevantes para actualizar balance, dashboard y cuentas
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });

      onComplete();
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      setError(err?.message || 'Ocurrió un error al guardar tu configuración. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header con indicador de progreso */}
        <div className="bg-gray-950/70 p-6 border-b border-gray-800/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Bienvenido a Dualis</h2>
                <p className="text-xs text-gray-400">Configura tu espacio financiero en 2 sencillos pasos</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
              Paso {step} de 2
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Cuerpo del Modal con los Pasos */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* PASO 1: Moneda Principal */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  1. ¿Cuál es tu moneda principal?
                </label>
                <p className="text-xs text-gray-400 mb-4">
                  Esta será la moneda predeterminada para tus cuentas, presupuestos y resúmenes del dashboard.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { code: 'USD', name: 'USD ($)', flag: '🇺🇸' },
                    { code: 'EUR', name: 'EUR (€)', flag: '🇪🇺' },
                    { code: 'PEN', name: 'PEN (S/)', flag: '🇵🇪' },
                    { code: 'COP', name: 'COP ($)', flag: '🇨🇴' },
                    { code: 'MXN', name: 'MXN ($)', flag: '🇲🇽' },
                    { code: 'ARS', name: 'ARS ($)', flag: '🇦🇷' },
                    { code: 'CLP', name: 'CLP ($)', flag: '🇨🇱' },
                    { code: 'BRL', name: 'BRL (R$)', flag: '🇧🇷' },
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setCurrency(item.code)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col items-start gap-1 cursor-pointer ${
                        currency === item.code
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-gray-800/40 border-gray-700/60 text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-base">{item.flag}</span>
                      <span className="text-xs font-bold">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: Primera Cuenta Financiera y Saldo Inicial */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Tu Primera Cuenta Financiera</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Agrega tu cuenta con su balance actual para que tu Dashboard refleje tu saldo disponible real.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Nombre de la Cuenta</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Ej. BCP Ahorros, BBVA, Efectivo billetera..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Tipo de Cuenta</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'SAVINGS', name: 'Ahorros', icon: PiggyBank },
                    { id: 'BANK', name: 'Bancaria', icon: Building2 },
                    { id: 'CASH', name: 'Efectivo', icon: DollarSign },
                    { id: 'CREDIT_CARD', name: 'Crédito', icon: CreditCard },
                  ].map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAccountType(t.id)}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                          accountType === t.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                            : 'bg-gray-800/40 border-gray-700/60 text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Saldo Inicial Actual ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-bold">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-16 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Resumen */}
              <div className="p-4 bg-gray-800/40 border border-gray-700/60 rounded-xl space-y-2 mt-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resumen:</span>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="text-gray-400">Moneda Base:</div>
                  <div className="text-white font-semibold text-right">{currency}</div>
                  <div className="text-gray-400">Primera Cuenta:</div>
                  <div className="text-white font-semibold text-right">{accountName || 'Ahorros'}</div>
                  <div className="text-gray-400">Saldo Inicial:</div>
                  <div className="text-emerald-400 font-semibold text-right">
                    {currency} {parseFloat(initialBalance || '0').toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Si deseas conectar a tu pareja, podrás compartirle un código de invitación más adelante desde Configuración.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer con Acciones */}
        <div className="bg-gray-950/70 p-4 sm:p-6 border-t border-gray-800/80 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              Atrás
            </button>
          ) : (
            <div />
          )}

          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              Continuar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleFinish}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Configurando...</span>
                </>
              ) : (
                <>
                  <span>Comenzar a usar Dualis</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

