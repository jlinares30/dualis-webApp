'use client';

import React, { useState } from 'react';
import {
  Wallet,
  CreditCard,
  Landmark,
  Plus,
  TrendingUp,
  MoreVertical,
  Pencil,
  Trash2,
  AlertTriangle,
  ArrowRightLeft,
  X
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { WorkspaceType } from '@/types';
import { useAccounts, useDeleteAccount, useUpdateAccount, CreateAccountModal, EditAccountModal, AccountItem, AccountCategory } from '@/features/accounts';
import { useCreateTransaction } from '@/features/transactions';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';

export default function AccountsPage({ workspace = 'personal' }: { workspace?: WorkspaceType }) {
  const { data: apiAccounts, isLoading } = useAccounts();
  const { mutateAsync: deleteAccountMut, isPending: isDeletingAccount } = useDeleteAccount();
  const { mutateAsync: createTransactionMut, isPending: isCreatingTransfer } = useCreateTransaction();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<AccountItem | null>(null);
  const [targetTransferAccountId, setTargetTransferAccountId] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { activeWorkspaceId, activeWorkspaceType, workspaces } = useWorkspaceStore();
  const { user } = useAuthStore();
  const { convert } = useExchangeRateStore();

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const baseCurrency = (activeWs?.currency || user?.preferredCurrency || 'PEN').toUpperCase();

  const getAccountColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'credit':
      case 'credit_card':
        return 'from-rose-600 to-pink-600';
      case 'bank':
      case 'savings':
        return 'from-emerald-600 to-teal-600';
      case 'digital':
        return 'from-purple-600 to-indigo-600';
      case 'cash':
        return 'from-amber-600 to-yellow-600';
      case 'investment':
        return 'from-cyan-600 to-blue-600';
      default:
        return 'from-indigo-600 to-blue-600';
    }
  };

  const getAccountCategory = (type: string): AccountCategory => {
    const lower = type.toLowerCase();
    if (lower.includes('credit')) return 'credit';
    if (lower.includes('cash')) return 'cash';
    if (lower.includes('digital') || lower.includes('yape') || lower.includes('plin')) return 'digital';
    if (lower.includes('investment')) return 'investment';
    return 'bank';
  };

  const accounts: AccountItem[] = apiAccounts
    ? apiAccounts
        .filter((a) => a.status !== 'ARCHIVED')
        .map((a) => ({
          id: a.id,
          name: a.name,
          type: getAccountCategory(a.type || 'bank'),
          balance: a.balance,
          currency: (a.currency && a.currency.trim() ? a.currency : baseCurrency).toUpperCase(),
          accountNumber: a.accountNumber,
          color: a.color || getAccountColor(a.type || 'bank'),
          workspace: (workspace as 'personal' | 'couple') || 'personal',
        }))
    : [];

  // Total convertido a la moneda del espacio
  const convertedTotalBalance = accounts.reduce((acc, curr) => {
    if (curr.currency === baseCurrency) return acc + curr.balance;
    return acc + convert(curr.balance, curr.currency, baseCurrency);
  }, 0);

  const convertedDebitBalance = accounts
    .filter((a) => a.balance > 0)
    .reduce((acc, curr) => {
      if (curr.currency === baseCurrency) return acc + curr.balance;
      return acc + convert(curr.balance, curr.currency, baseCurrency);
    }, 0);

  const convertedCreditBalance = accounts
    .filter((a) => a.balance < 0)
    .reduce((acc, curr) => {
      const positiveAmt = Math.abs(curr.balance);
      if (curr.currency === baseCurrency) return acc + positiveAmt;
      return acc + convert(positiveAmt, curr.currency, baseCurrency);
    }, 0);

  // Desglose por moneda
  const currencyBreakdown = React.useMemo(() => {
    const map: { [curr: string]: number } = {};
    accounts.forEach((acc) => {
      map[acc.currency] = (map[acc.currency] || 0) + acc.balance;
    });
    return Object.entries(map).map(([curr, amount]) => ({
      currency: curr,
      amount,
    }));
  }, [accounts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1">
              <Wallet className="w-3 h-3" /> Cuentas & Bolsillos
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Gestión de Cuentas
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            {activeWorkspaceType === 'couple'
              ? 'Cuentas conjuntas o fondo común de la pareja. Recuerda que al registrar transacciones compartidas también puedes pagar directamente con tus cuentas personales.'
              : 'Administra tus fuentes de dinero, bancos y tarjetas personales en cualquier divisa.'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nueva Cuenta
        </button>
      </div>

      {/* Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/40 via-gray-900 to-emerald-950/30 border border-indigo-500/20 p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Patrimonio Consolidado ({baseCurrency})
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-1">
              {formatCurrency(convertedTotalBalance, baseCurrency)}
            </h2>
            <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Saldo unificado entre {accounts.length} cuentas activas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-2xl bg-gray-900/80 border border-gray-800 text-center">
              <span className="block text-[10px] text-gray-400 uppercase font-semibold">Cuentas Débito</span>
              <span className="text-sm font-bold text-emerald-400">
                {formatCurrency(convertedDebitBalance, baseCurrency)}
              </span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-gray-900/80 border border-gray-800 text-center">
              <span className="block text-[10px] text-gray-400 uppercase font-semibold">Pasivos / Crédito</span>
              <span className="text-sm font-bold text-rose-400">
                {formatCurrency(convertedCreditBalance, baseCurrency)}
              </span>
            </div>
          </div>
        </div>

        {/* Desglose multimoneda visual */}
        {currencyBreakdown.length > 0 && (
          <div className="pt-3 border-t border-gray-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Desglose por divisa:
              </span>
              <div className="flex flex-wrap gap-2">
                {currencyBreakdown.map((item) => (
                  <div
                    key={item.currency}
                    className="px-3 py-1 rounded-xl bg-gray-950/70 border border-gray-800 flex items-center gap-2"
                  >
                    <span className="text-xs font-bold text-gray-300">{item.currency}:</span>
                    <span className={`text-xs font-semibold ${item.amount < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatCurrency(item.amount, item.currency)}
                    </span>
                    {item.currency !== baseCurrency && (
                      <span className="text-[10px] text-gray-500">
                        ≈ {formatCurrency(convert(item.amount, item.currency, baseCurrency), baseCurrency)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Accounts */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-[#0f172a]/60 animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 rounded-3xl bg-[#0f172a]/40 border border-gray-800/40 border-dashed space-y-3">
          <Wallet className="w-10 h-10 text-gray-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-gray-300">No tienes cuentas o bolsillos creados aún</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Presiona "Nueva Cuenta" para agregar tu primer banco, billetera Yape/Plin o efectivo.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-semibold hover:bg-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Agregar mi primera cuenta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => {
            const isNegative = acc.balance < 0;
            const isMenuOpen = openMenuId === acc.id;

            return (
              <div
                key={acc.id}
                className="relative overflow-hidden rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-lg hover:border-gray-700 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${acc.color} flex items-center justify-center text-white shadow-md`}>
                    {acc.type === 'credit' ? (
                      <CreditCard className="w-5 h-5" />
                    ) : acc.type === 'bank' ? (
                      <Landmark className="w-5 h-5" />
                    ) : (
                      <Wallet className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                      {acc.type}
                    </span>

                    {/* Actions Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(isMenuOpen ? null : acc.id);
                        }}
                        className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                        title="Opciones de cuenta"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                            }}
                          />
                          <div className="absolute right-0 top-7 w-36 rounded-xl bg-gray-900 border border-gray-800 shadow-xl py-1 z-40 animate-in fade-in-50 zoom-in-95">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                setEditingAccount(acc);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-indigo-600/20 transition-colors text-left cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                setAccountToDelete(acc);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <h3 className="font-bold text-base text-white group-hover:text-indigo-400 transition-colors">
                    {acc.name}
                  </h3>
                  {acc.accountNumber && (
                    <p className="text-xs text-gray-500 font-mono">
                      Nº {acc.accountNumber}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-800/80 flex items-baseline justify-between">
                  <span className="text-xs text-gray-400">Saldo actual</span>
                  <div className="text-right">
                    <span className={`block font-bold text-lg ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatCurrency(acc.balance, acc.currency)}
                    </span>
                    {acc.currency !== baseCurrency && (
                      <span className="block text-[11px] text-gray-400 font-medium">
                        ≈ {formatCurrency(convert(acc.balance, acc.currency, baseCurrency), baseCurrency)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear Cuenta */}
      <CreateAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Modal Editar Cuenta */}
      <EditAccountModal
        isOpen={Boolean(editingAccount)}
        onClose={() => setEditingAccount(null)}
        account={editingAccount}
      />

      {/* Modal Confirmar Eliminación con opción de transferir saldo */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative w-full max-w-sm bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">¿Eliminar Cuenta?</h3>
                <p className="text-xs text-gray-400">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar la cuenta <strong className="text-white">"{accountToDelete.name}"</strong> con saldo de <strong>{formatCurrency(accountToDelete.balance, accountToDelete.currency)}</strong>?
            </p>

            {/* Si la cuenta tiene saldo positivo y hay otras cuentas disponibles */}
            {accountToDelete.balance > 0 && accounts.filter((a) => a.id !== accountToDelete.id).length > 0 && (
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transferir saldo remanente (Opcional)</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Transfiere los <strong>{formatCurrency(accountToDelete.balance, accountToDelete.currency)}</strong> a otra cuenta antes de eliminarla:
                </p>
                <select
                  value={targetTransferAccountId}
                  onChange={(e) => setTargetTransferAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">No transferir (descartar saldo)</option>
                  {accounts
                    .filter((a) => a.id !== accountToDelete.id)
                    .map((dest) => (
                      <option key={dest.id} value={dest.id}>
                        {dest.name} ({dest.currency}) - Saldo actual: {formatCurrency(dest.balance, dest.currency)}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAccountToDelete(null);
                  setTargetTransferAccountId('');
                  setDeleteError(null);
                }}
                disabled={isDeletingAccount || isCreatingTransfer || isDeletingLoading}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setDeleteError(null);
                  setIsDeletingLoading(true);
                  try {
                    // Si se seleccionó transferir el saldo a otra cuenta
                    if (targetTransferAccountId && accountToDelete.balance > 0) {
                      const destAccount = accounts.find((a) => a.id === targetTransferAccountId);
                      if (destAccount) {
                        await createTransactionMut({
                          workspaceId: activeWorkspaceId!,
                          accountId: accountToDelete.id,
                          targetAccountId: destAccount.id,
                          amount: Number(accountToDelete.balance),
                          currency: accountToDelete.currency,
                          type: 'TRANSFER',
                          description: `Transferencia por cierre/eliminación de cuenta "${accountToDelete.name}" hacia "${destAccount.name}"`,
                          transactionDate: new Date().toISOString(),
                        });
                      }
                    }

                    await deleteAccountMut(accountToDelete.id);
                    setAccountToDelete(null);
                    setTargetTransferAccountId('');
                  } catch (delErr: any) {
                    console.error('Error al eliminar cuenta:', delErr);
                    setDeleteError(delErr?.message || 'Error al eliminar la cuenta. Inténtalo nuevamente.');
                  } finally {
                    setIsDeletingLoading(false);
                  }
                }}
                disabled={isDeletingAccount || isCreatingTransfer || isDeletingLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeletingAccount || isCreatingTransfer || isDeletingLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
