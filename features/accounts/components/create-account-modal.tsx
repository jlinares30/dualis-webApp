import React, { useState } from 'react';
import { X, Wallet, Landmark, CreditCard, Sparkles, DollarSign } from 'lucide-react';
import { useCreateAccount } from '@/hooks';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAccountModal({ isOpen, onClose }: CreateAccountModalProps) {
  const { mutateAsync: createAccount, isPending } = useCreateAccount();
  const { activeWorkspaceId, workspaces } = useWorkspaceStore();
  const { user } = useAuthStore();
  const { rates } = useExchangeRateStore();

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const defaultCurrency = (activeWs?.currency || user?.preferredCurrency || 'USD').toUpperCase();

  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [balance, setBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [customCurrency, setCustomCurrency] = useState('');
  const [isCustomCurrency, setIsCustomCurrency] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance) return;

    const finalCurrency = (isCustomCurrency && customCurrency.trim() ? customCurrency.trim() : currency).toUpperCase();

    const accountTypeMap: Record<string, string> = {
      bank: 'BANK',
      digital: 'BANK',
      credit: 'CREDIT_CARD',
      cash: 'CASH',
    };

    try {
      await createAccount({
        workspaceId: activeWorkspaceId!,
        name,
        type: accountTypeMap[type] || 'BANK',
        balance: parseFloat(balance) || 0,
        currency: finalCurrency,
        description: accountNumber ? `Cuenta termina en ${accountNumber}` : undefined,
      });
      setName('');
      setBalance('');
      setAccountNumber('');
      setCurrency(defaultCurrency);
      setIsCustomCurrency(false);
      onClose();
    } catch (err) {
      console.error('Error al crear cuenta:', err);
      onClose();
    }
  };

  // Combinar monedas populares con las disponibles en el store de tasas
  const availableCurrencies = Array.from(
    new Set(['USD', 'PEN', 'EUR', 'COP', 'MXN', 'ARS', 'CLP', 'BRL', 'GBP', 'CAD', ...Object.keys(rates)])
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Nueva Cuenta o Bolsillo</h3>
            <p className="text-xs text-gray-400">Registra un banco, tarjeta o billetera en cualquier divisa</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre de la Cuenta</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. BCP Dólares, BBVA Ahorros, Efectivo..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Tipo de Cuenta</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="bank">Banco Débito</option>
                <option value="digital">Digital (Yape/Plin/PayPal)</option>
                <option value="credit">Tarjeta de Crédito</option>
                <option value="cash">Efectivo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Moneda de la Cuenta</label>
              {!isCustomCurrency ? (
                <select
                  value={currency}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustomCurrency(true);
                    } else {
                      setCurrency(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white font-semibold outline-none focus:border-indigo-500"
                >
                  {availableCurrencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Otra Moneda...</option>
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    maxLength={4}
                    value={customCurrency}
                    onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
                    placeholder="AUD"
                    className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-indigo-500 text-xs text-white uppercase outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomCurrency(false)}
                    className="p-2 text-gray-400 hover:text-white rounded-lg bg-gray-800 text-xs"
                    title="Volver a lista"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Saldo Inicial ({isCustomCurrency && customCurrency ? customCurrency.toUpperCase() : currency})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">
                {isCustomCurrency && customCurrency ? customCurrency.toUpperCase() : currency}
              </span>
              <input
                type="number"
                step="any"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="1000"
                className="w-full pl-14 pr-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Últimos 4 dígitos (Opcional)</label>
            <input
              type="text"
              maxLength={4}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Ej. 4821"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex gap-3 pt-3">
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
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
