import React, { useState, useEffect } from 'react';
import { X, Wallet, Landmark, CreditCard, Sparkles, DollarSign, Lock, Scale, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useUpdateAccount } from '@/hooks';
import { useCreateTransaction } from '@/features/transactions';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';
import { formatCurrency } from '@/lib/utils';
import { AccountItem } from '../types/accounts';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: AccountItem | null;
}

export function EditAccountModal({ isOpen, onClose, account }: EditAccountModalProps) {
  const { mutateAsync: updateAccountMut, isPending: isUpdatingAccount } = useUpdateAccount();
  const { mutateAsync: createTransactionMut, isPending: isCreatingAdjustment } = useCreateTransaction();
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

  const originalBalance = account.balance || 0;
  let parsedBalance = parseFloat(balance) || 0;
  if (type === 'credit' && parsedBalance > 0) {
    parsedBalance = -Math.abs(parsedBalance);
  }

  // Diferencia entre el saldo ingresado y el saldo original de la cuenta
  const balanceDelta = Number((parsedBalance - originalBalance).toFixed(2));
  const hasBalanceChanged = Math.abs(balanceDelta) >= 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('El nombre de la cuenta es obligatorio.');
      return;
    }

    const accountTypeMap: Record<string, string> = {
      bank: 'BANK',
      digital: 'DIGITAL',
      credit: 'CREDIT_CARD',
      cash: 'CASH',
      investment: 'INVESTMENT',
    };

    try {
      // 1. Actualizar metadatos de la cuenta en el backend
      await updateAccountMut({
        id: account.id,
        data: {
          workspaceId: activeWorkspaceId!,
          name: name.trim(),
          type: accountTypeMap[type] || 'BANK',
          currency: currency.toUpperCase(),
          description: accountNumber ? `Cuenta termina en ${accountNumber}` : undefined,
        },
      });

      // 2. Si el usuario modificó el saldo, generar una transacción contable de ajuste
      if (hasBalanceChanged) {
        const isPositiveAdjustment = balanceDelta > 0;
        const adjustmentAmount = Math.abs(balanceDelta);

        await createTransactionMut({
          workspaceId: activeWorkspaceId!,
          accountId: account.id,
          amount: adjustmentAmount,
          currency: account.currency,
          type: isPositiveAdjustment ? 'INCOME' : 'EXPENSE',
          description: isPositiveAdjustment
            ? `Ajuste contable positivo (Saldo alineado de ${formatCurrency(originalBalance, account.currency)} a ${formatCurrency(parsedBalance, account.currency)})`
            : `Ajuste contable negativo (Saldo alineado de ${formatCurrency(originalBalance, account.currency)} a ${formatCurrency(parsedBalance, account.currency)})`,
          transactionDate: new Date().toISOString(),
        });
      }

      onClose();
    } catch (err: any) {
      console.error('Error al actualizar cuenta o registrar ajuste:', err);
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
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-300">Moneda</label>
                <span className="text-[10px] text-gray-500 flex items-center gap-0.5" title="No modificable para preservar historial">
                  <Lock className="w-2.5 h-2.5 text-gray-500" /> Fija
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={currency}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950/70 border border-gray-800 text-xs text-indigo-300 font-bold cursor-not-allowed opacity-80"
                />
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[11px] text-gray-400 flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              La divisa no se puede modificar tras la creación para proteger la integridad de tus reportes y transacciones históricas.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                {type === 'credit' ? 'Deuda Actual' : 'Saldo Actual'}
              </label>
              <input
                type="number"
                step="any"
                value={type === 'credit' && Number(balance) < 0 ? String(Math.abs(Number(balance))) : balance}
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

          {/* Aviso visual de Ajuste Contable en tiempo real */}
          {hasBalanceChanged && (
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1 animate-in fade-in-50">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Scale className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ajuste Contable Automático</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                El saldo difiere en{' '}
                <strong className={balanceDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {balanceDelta > 0 ? `+${formatCurrency(balanceDelta, account.currency)}` : formatCurrency(balanceDelta, account.currency)}
                </strong>
                . Se registrará automáticamente un movimiento de ajuste contable de tipo{' '}
                <span className="font-semibold text-white">{balanceDelta > 0 ? 'INGRESO' : 'GASTO'}</span> para sincronizar tu balance sin desfasar el historial.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdatingAccount || isCreatingAdjustment}
              className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUpdatingAccount || isCreatingAdjustment}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isUpdatingAccount || isCreatingAdjustment ? (
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
