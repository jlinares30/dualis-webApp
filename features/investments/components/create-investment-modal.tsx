'use client';

import React, { useState } from 'react';
import { X, TrendingUp, Landmark, ShieldCheck, ArrowRight, Wallet } from 'lucide-react';
import { useCreateInvestment, useAccounts, useCreateTransaction } from '@/hooks';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';

interface CreateInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateInvestmentModal({ isOpen, onClose }: CreateInvestmentModalProps) {
  const { mutateAsync: createInv, isPending } = useCreateInvestment();
  const { data: apiAccounts } = useAccounts();
  const { mutateAsync: createTxMut } = useCreateTransaction();
  const { convert } = useExchangeRateStore();
  const { activeWorkspaceId, workspaces } = useWorkspaceStore();
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const workspaceCurrency = activeWs?.currency || 'PEN';

  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [type, setType] = useState('MUTUAL_FUNDS');
  const [currency, setCurrency] = useState(workspaceCurrency);
  const [initialCapital, setInitialCapital] = useState('');
  const [currentValue, setCurrentValue] = useState('');

  // Estado para Fondeo desde Cuenta Bancaria / Líquida
  // Ordenamos para priorizar cuentas de la misma divisa pero permitiendo seleccionar cualquiera con conversión libre
  const liquidAccounts = React.useMemo(() => {
    const list = (apiAccounts || []).filter(
      (a) => a.status !== 'ARCHIVED' && a.type?.toUpperCase() !== 'INVESTMENT'
    );
    return list.sort((a, b) => {
      const aMatch = (a.currency || workspaceCurrency) === currency ? 1 : 0;
      const bMatch = (b.currency || workspaceCurrency) === currency ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [apiAccounts, currency, workspaceCurrency]);

  const [deductFromAccount, setDeductFromAccount] = useState(liquidAccounts.length > 0);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Sincronizar cuenta seleccionada si cambia la lista o la divisa
  React.useEffect(() => {
    if (liquidAccounts.length > 0 && (!selectedAccountId || !liquidAccounts.some(a => a.id === selectedAccountId))) {
      setSelectedAccountId(liquidAccounts[0].id);
    }
  }, [liquidAccounts, selectedAccountId]);

  const COMMON_CURRENCIES = ['PEN', 'USD', 'EUR', 'COP', 'MXN', 'CLP', 'ARS', 'BRL'];

  const getCurrencySymbol = (curr: string) => {
    return curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'PEN' ? 'S/' : curr;
  };

  if (!isOpen) return null;

  const parsedCapital = parseFloat(initialCapital) || 0;

  const originAccount = liquidAccounts.find((a) => a.id === selectedAccountId);
  const originCurrency = originAccount?.currency || workspaceCurrency;

  let amountToDeduct = parsedCapital;
  if (originAccount && originCurrency !== currency && parsedCapital > 0) {
    amountToDeduct = parseFloat(convert(parsedCapital, currency, originCurrency).toFixed(2));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !initialCapital) return;

    try {
      // 1. Crear la Inversión en el portafolio
      await createInv({
        name,
        institution: institution || 'Entidad Financiera',
        type,
        initialCapital: parsedCapital,
        currentValue: currentValue ? parseFloat(currentValue) : parsedCapital,
        currency,
        workspaceId: activeWorkspaceId || undefined,
      });

      // 2. Si el usuario marcó descontar de cuenta líquida, crear la transacción de salida (FONDEO DE INVERSIÓN)
      if (deductFromAccount && originAccount && parsedCapital > 0) {
        try {
          await createTxMut({
            workspaceId: originAccount.workspaceId || activeWorkspaceId!,
            accountId: originAccount.id,
            amount: amountToDeduct,
            currency: originCurrency,
            type: 'EXPENSE',
            categoryNature: 'INVESTMENT',
            description: `Fondeo de inversión: ${name} (${institution || 'Portafolio'})`,
            transactionDate: new Date().toISOString(),
          });
        } catch (txErr) {
          console.error('Error al registrar transacción de débito de cuenta:', txErr);
        }
      }

      setName('');
      setInstitution('');
      setInitialCapital('');
      setCurrentValue('');
      setCurrency(workspaceCurrency);
      onClose();
    } catch (err) {
      console.error('Error al registrar inversión:', err);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in-50">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Nueva Inversión</h3>
            <p className="text-xs text-gray-400">Registra un fondo, plazo fijo, acciones o cripto</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre de la Inversión</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Fondo Mutuo Conservador BCP"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Plataforma / Banco</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ej. Tyba / Hapi / BCP"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Moneda del Activo</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white font-semibold outline-none focus:border-emerald-500 cursor-pointer"
              >
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c} ({getCurrencySymbol(c)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Tipo de Activo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="MUTUAL_FUNDS">Fondos Mutuos</option>
              <option value="FIXED_TERM">Plazo Fijo</option>
              <option value="STOCKS">Acciones / ETFs</option>
              <option value="CRYPTO">Criptomonedas</option>
              <option value="CROWDLENDING">Facturaje / Facturas</option>
              <option value="REAL_ESTATE">Bienes Raíces</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Capital Invertido ({getCurrencySymbol(currency)} {currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                placeholder="5000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500 font-mono font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Valor Inicial ({getCurrencySymbol(currency)} {currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder={initialCapital || "5000"}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Opciones de Fondeo desde Cuenta Líquida */}
          <div className="p-3.5 rounded-2xl bg-gray-900/90 border border-gray-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deductFromAccount}
                  onChange={(e) => setDeductFromAccount(e.target.checked)}
                  className="rounded border-gray-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Fondear desde una cuenta líquida
                </span>
              </label>
            </div>

            {deductFromAccount && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                {liquidAccounts.length === 0 ? (
                  <p className="text-[11px] text-amber-400/90">
                    No tienes cuentas disponibles para descontar fondos.
                  </p>
                ) : (
                  <>
                    <select
                      value={selectedAccountId || liquidAccounts[0]?.id}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {liquidAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.currency || workspaceCurrency}) - Saldo: {acc.balance.toLocaleString()} {acc.currency || workspaceCurrency}
                        </option>
                      ))}
                    </select>

                    {originCurrency !== currency && parsedCapital > 0 && (
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                        <span>Se debitará de la cuenta:</span>
                        <span className="font-bold font-mono">
                          {amountToDeduct.toLocaleString()} {originCurrency}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Registrar Inversión'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

