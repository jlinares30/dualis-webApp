import React, { useState, useEffect } from 'react';
import { X, Wallet, Landmark, CreditCard, Sparkles, DollarSign } from 'lucide-react';
import { useUpdateAccount } from '@/hooks';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';
import { AccountItem } from '../types/accounts';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: AccountItem | null;
}

export function EditAccountModal({ isOpen, onClose, account }: EditAccountModalProps) {
  const { mutateAsync: updateAccountMut, isPending } = useUpdateAccount();
  const { activeWorkspaceId } = useWorkspaceStore();
  const { rates } = useExchangeRateStore();

  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [balance, setBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [currency, setCurrency] = useState('PEN');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setName(account.name || '');
      setType(account.type || 'bank');
      setBalance(account.balance !== undefined ? String(account.balance) : '0');
      setAccountNumber(account.accountNumber || '');
      setCurrency(account.currency || 'PEN');
      setError(null);
    }
  }, [account, isOpen]);

  if (!isOpen || !account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('El nombre de la cuenta es obligatorio.');
      return;
    }

    const accountTypeMap: Record<string, string> = {
      bank: 'BANK',
      digital: 'BANK',
      credit: 'CREDIT_CARD',
      cash: 'CASH',
      investment: 'INVESTMENT',
    };

    try {
      await updateAccountMut({
        id: account.id,
        data: {
          workspaceId: activeWorkspaceId!,
          name: name.trim(),
          type: accountTypeMap[type] || 'BANK',
          balance: parseFloat(balance) || 0,
          currency: currency.toUpperCase(),
          description: accountNumber ? `Cuenta termina en ${accountNumber}` : undefined,
        },
      });
      onClose();
    } catch (err: any) {
      console.error('Error al actualizar cuenta:', err);
      setError(err?.message || 'Error al actualizar la cuenta.');
    }
  };

  const availableCurrencies = Array.from(
    new Set(['USD', 'PEN', 'EUR', 'COP', 'MXN', 'ARS', 'CLP', 'BRL', 'GBP', 'CAD', ...Object.keys(rates)])
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Editar Cuenta</h3>
            <p className="text-xs text-gray-400">Modifica el saldo, nombre o divisa de esta cuenta</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre de la Cuenta</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. BCP Dólares, BBVA Ahorros..."
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="bank">Cuenta Bancaria</option>
                <option value="digital">Billetera Digital (Yape/Plin)</option>
                <option value="credit">Tarjeta de Crédito</option>
                <option value="cash">Efectivo</option>
                <option value="investment">Inversión</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Moneda de la Cuenta</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-indigo-300 font-semibold outline-none focus:border-indigo-500 cursor-pointer"
              >
                {availableCurrencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Saldo Actual</label>
              <input
                type="number"
                step="any"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Últimos dígitos (Opcional)</label>
              <input
                type="text"
                maxLength={8}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Ej. 4521"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
