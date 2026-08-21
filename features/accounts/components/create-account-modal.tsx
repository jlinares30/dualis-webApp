'use client';

import React, { useState } from 'react';
import { X, Wallet, Landmark, CreditCard, Sparkles } from 'lucide-react';
import { useCreateAccount } from '@/hooks';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAccountModal({ isOpen, onClose }: CreateAccountModalProps) {
  const { mutateAsync: createAccount, isPending } = useCreateAccount();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [balance, setBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance) return;

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
        currency: 'PEN',
        description: accountNumber ? `Cuenta termina en ${accountNumber}` : undefined,
      });
      setName('');
      setBalance('');
      setAccountNumber('');
      onClose();
    } catch (err) {
      console.error('Error al crear cuenta:', err);
      onClose();
    }

  };

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
            <p className="text-xs text-gray-400">Registra un banco, tarjeta o billetera digital</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre de la Cuenta</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. BCP Ahorros / Yape"
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
                <option value="digital">Digital (Yape/Plin)</option>
                <option value="credit">Tarjeta de Crédito</option>
                <option value="cash">Efectivo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Saldo Inicial (S/ PEN)</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="1200"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
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
              className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium text-xs transition-colors"
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
