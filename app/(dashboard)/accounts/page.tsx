'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  X,
  Archive,
  Banknote,
  ReceiptText,
  Target,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { WorkspaceType } from '@/types';
import { useAccounts, useDeleteAccount, useUpdateAccount, CreateAccountModal, EditAccountModal, AccountItem, AccountCategory } from '@/features/accounts';
import { useGoals } from '@/features/goals';
import { useCreateTransaction } from '@/features/transactions';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';
import { useGuestGate } from '@/hooks';
import { AuthModal } from '@/features/auth';

export default function AccountsPage({ workspace = 'personal' }: { workspace?: WorkspaceType }) {
  const { data: apiAccounts, isLoading } = useAccounts();
  const { data: goals = [] } = useGoals();
  const { mutateAsync: deleteAccountMut, isPending: isDeletingAccount } = useDeleteAccount();
  const { mutateAsync: createTransactionMut, isPending: isCreatingTransfer } = useCreateTransaction();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<AccountItem | null>(null);
  const [targetTransferAccountId, setTargetTransferAccountId] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | AccountCategory>('all');
  const { activeWorkspaceId, activeWorkspaceType, workspaces } = useWorkspaceStore();
  const { user } = useAuthStore();
  const convert = useExchangeRateStore((s) => s.convert);
  const { isGuest, isAuthModalOpen, requireAuth, closeAuthModal, gateConfig } = useGuestGate();

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

  const getAccountCategory = (type: string, name?: string, description?: string): AccountCategory => {
    const combined = `${type} ${name || ''} ${description || ''}`.toLowerCase();
    if (combined.includes('credit') || combined.includes('crédito') || combined.includes('tarjeta')) return 'credit';
    if (combined.includes('cash') || combined.includes('efectivo')) return 'cash';
    if (combined.includes('digital') || combined.includes('wallet') || combined.includes('yape') || combined.includes('plin') || combined.includes('paypal') || combined.includes('mp') || combined.includes('mercado')) return 'digital';
    if (combined.includes('investment') || combined.includes('inversion') || combined.includes('inversión')) return 'investment';
    return 'bank';
  };

  const accounts: AccountItem[] = React.useMemo(() => {
    if (!apiAccounts) return [];
    return apiAccounts
      .filter((a) => a.status !== 'ARCHIVED' && a.type?.toUpperCase() !== 'INVESTMENT')
      .map((a) => {
        // Si no viene accountNumber explícito, intentar extraerlo de la descripción "Cuenta termina en XXXX"
        let parsedAccountNumber = a.accountNumber;
        if (!parsedAccountNumber && a.description) {
          const match = a.description.match(/(?:termina en|n[úu]mero|n[ºo]\.?)\s*(\d{2,8})/i);
          if (match) {
            parsedAccountNumber = match[1];
          }
        }

        const category = getAccountCategory(a.type || 'bank', a.name, a.description);

        return {
          id: a.id,
          name: a.name,
          type: category,
          balance: a.balance,
          currency: (a.currency && a.currency.trim() ? a.currency : baseCurrency).toUpperCase(),
          accountNumber: parsedAccountNumber,
          color: a.color || getAccountColor(category),
          workspace: (workspace as 'personal' | 'couple') || 'personal',
        };
      });
  }, [apiAccounts, baseCurrency, workspace]);

  // Totales convertidos a la moneda del espacio memoizados
  const { convertedTotalBalance, convertedDebitBalance, convertedCreditBalance } = React.useMemo(() => {
    let debit = 0;
    let credit = 0;

    accounts.forEach((curr) => {
      // Si es tarjeta de crédito:
      // - Si el saldo está en negativo (ej. -500), representa deuda de 500.
      // - Si el usuario lo guardó positivo (ej. 500), en tarjetas de crédito representa la deuda utilizada.
      if (curr.type === 'credit') {
        const debt = Math.abs(curr.balance);
        credit += curr.currency === baseCurrency ? debt : convert(debt, curr.currency, baseCurrency);
      } else {
        if (curr.balance >= 0) {
          const converted = curr.currency === baseCurrency ? curr.balance : convert(curr.balance, curr.currency, baseCurrency);
          debit += converted;
        } else {
          // Sobregiro bancario u saldo negativo en cuenta
          const positiveAmt = Math.abs(curr.balance);
          credit += curr.currency === baseCurrency ? positiveAmt : convert(positiveAmt, curr.currency, baseCurrency);
        }
      }
    });

    return {
      convertedTotalBalance: debit - credit,
      convertedDebitBalance: debit,
      convertedCreditBalance: credit,
    };
  }, [accounts, baseCurrency, convert]);

  // Total acumulado en metas de ahorro convertido a moneda base
  const totalSavingsInGoals = React.useMemo(() => {
    return goals.reduce((acc, g) => {
      const gCurr = g.currency || baseCurrency;
      return acc + convert(g.currentAmount || 0, gCurr, baseCurrency);
    }, 0);
  }, [goals, baseCurrency, convert]);

  const freeToSpendBalance = Math.max(0, convertedDebitBalance - totalSavingsInGoals);

  // Desglose por moneda (saldo neto por divisa)
  const currencyBreakdown = React.useMemo(() => {
    const map: { [curr: string]: number } = {};
    accounts.forEach((acc) => {
      const netAmount = acc.type === 'credit' ? -Math.abs(acc.balance) : acc.balance;
      map[acc.currency] = (map[acc.currency] || 0) + netAmount;
    });
    return Object.entries(map).map(([curr, amount]) => ({
      currency: curr,
      amount,
    }));
  }, [accounts]);

  // Cuentas filtradas por categoría
  const displayedAccounts = React.useMemo(() => {
    if (selectedCategory === 'all') return accounts;
    return accounts.filter((a) => a.type === selectedCategory);
  }, [accounts, selectedCategory]);

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
          onClick={() => {
            requireAuth(
              () => setIsModalOpen(true),
              {
                title: 'Administra tus Cuentas Bancarias',
                subtitle: 'Crea tu cuenta gratis para conectar tus bancos, tarjetas y billeteras digitales.',
              }
            );
          }}
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3.5 py-2 rounded-2xl bg-gray-900/80 border border-gray-800 text-center">
              <span className="block text-[10px] text-gray-400 uppercase font-semibold">Cuentas Débito</span>
              <span className="text-sm font-bold text-white font-mono">
                {formatCurrency(convertedDebitBalance, baseCurrency)}
              </span>
            </div>
            {totalSavingsInGoals > 0 && (
              <div className="px-3.5 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                <span className="block text-[10px] text-indigo-400 uppercase font-semibold flex items-center justify-center gap-1">
                  <Target className="w-2.5 h-2.5" /> En Metas
                </span>
                <span className="text-sm font-bold text-indigo-300 font-mono">
                  {formatCurrency(totalSavingsInGoals, baseCurrency)}
                </span>
              </div>
            )}
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="block text-[10px] text-emerald-400 uppercase font-semibold flex items-center justify-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" /> Libre para Gastar
              </span>
              <span className="text-sm font-bold text-emerald-300 font-mono">
                {formatCurrency(freeToSpendBalance, baseCurrency)}
              </span>
            </div>
            {convertedCreditBalance > 0 && (
              <div className="px-3.5 py-2 rounded-2xl bg-gray-900/80 border border-gray-800 text-center">
                <span className="block text-[10px] text-gray-400 uppercase font-semibold">Pasivos / Crédito</span>
                <span className="text-sm font-bold text-rose-400 font-mono">
                  {formatCurrency(convertedCreditBalance, baseCurrency)}
                </span>
              </div>
            )}
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

      {/* Filtros por Categoría */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'Todas las cuentas', count: accounts.length },
          { key: 'bank', label: 'Bancos', count: accounts.filter((a) => a.type === 'bank').length },
          { key: 'digital', label: 'Billeteras Digitales', count: accounts.filter((a) => a.type === 'digital').length },
          { key: 'credit', label: 'Tarjetas de Crédito', count: accounts.filter((a) => a.type === 'credit').length },
          { key: 'cash', label: 'Efectivo', count: accounts.filter((a) => a.type === 'cash').length },
        ]
          .filter((tab) => tab.key === 'all' || tab.count > 0)
          .map((tab) => {
            const isActive = selectedCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-gray-900/80 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800/80'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-indigo-700 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
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
      ) : displayedAccounts.length === 0 ? (
        <div className="text-center py-8 rounded-2xl bg-[#0f172a]/40 border border-gray-800/40 text-gray-400 text-xs">
          No hay cuentas en esta categoría seleccionada.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedAccounts.map((acc) => {
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
                            <Link
                              href={`/transactions?accountId=${acc.id}`}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-gray-800 transition-colors text-left"
                            >
                              <ReceiptText className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Movimientos</span>
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                requireAuth(
                                  () => setEditingAccount(acc),
                                  {
                                    title: 'Editar Cuenta Bancaria',
                                    subtitle: 'Crea tu cuenta gratis para gestionar y personalizar tus cuentas bancarias.',
                                  }
                                );
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
                                requireAuth(
                                  () => setAccountToDelete(acc),
                                  {
                                    title: 'Archivar Cuenta Bancaria',
                                    subtitle: 'Crea tu cuenta gratis para archivar o eliminar cuentas.',
                                  }
                                );
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors text-left cursor-pointer"
                            >
                              <Archive className="w-3.5 h-3.5 text-amber-400" />
                              <span>Archivar</span>
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

                {/* Desglose de Metas y Saldo Disponible por cuenta */}
                {(() => {
                  if (acc.type === 'credit') return null;

                  // Metas que están explícitamente vinculadas a esta cuenta desde la base de datos (g.accountId)
                  const matchingGoals = goals.filter((g) => {
                    if (g.accountId) {
                      return g.accountId === acc.id && g.currentAmount > 0;
                    }
                    const gCurr = g.currency || baseCurrency;
                    return gCurr.toUpperCase() === acc.currency.toUpperCase() && g.currentAmount > 0;
                  });

                  // Sumar convirtiendo a la divisa nativa de la cuenta si difiere
                  let hasCurrencyConversion = false;
                  const accountGoalsTotal = matchingGoals.reduce((sum, g) => {
                    const gCurr = (g.currency || baseCurrency).toUpperCase();
                    const accCurr = acc.currency.toUpperCase();
                    if (gCurr !== accCurr) {
                      hasCurrencyConversion = true;
                      const converted = convert(g.currentAmount || 0, gCurr, accCurr);
                      return sum + converted;
                    }
                    return sum + (g.currentAmount || 0);
                  }, 0);

                  const accountFreeToSpend = Math.max(0, acc.balance - accountGoalsTotal);

                  if (accountGoalsTotal <= 0) return null;

                  return (
                    <div className="mb-3 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-indigo-300 font-semibold flex items-center gap-1">
                          <Target className="w-3 h-3 text-indigo-400" /> Respaldando {matchingGoals.length} {matchingGoals.length === 1 ? 'meta' : 'metas'}:
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-indigo-200 font-mono">
                            {formatCurrency(accountGoalsTotal, acc.currency)}
                          </span>
                          {hasCurrencyConversion && (
                            <span className="block text-[9px] text-indigo-400/80 italic font-sans">
                              (incluye conv. de divisa)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-indigo-500/15">
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Libre para gastar:
                        </span>
                        <span className="font-extrabold text-emerald-300 font-mono">
                          {formatCurrency(accountFreeToSpend, acc.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-3 border-t border-gray-800/80 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-gray-400 block">
                      {acc.type === 'credit' ? 'Deuda actual' : 'Saldo total en banco'}
                    </span>
                    {acc.type !== 'credit' && isNegative && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 mt-1">
                        ⚠️ En sobregiro
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`block font-bold text-lg ${
                        acc.type === 'credit'
                          ? acc.balance !== 0
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                          : isNegative
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {formatCurrency(acc.type === 'credit' ? Math.abs(acc.balance) : acc.balance, acc.currency)}
                    </span>
                    {acc.currency !== baseCurrency && (
                      <span className="block text-[11px] text-gray-400 font-medium">
                        ≈ {formatCurrency(convert(acc.type === 'credit' ? Math.abs(acc.balance) : acc.balance, acc.currency, baseCurrency), baseCurrency)}
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
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Archive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">¿Desactivar / Archivar Cuenta?</h3>
                <p className="text-xs text-gray-400">Pasará a estado inactivo sin perder tu historial</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              La cuenta <strong className="text-white">"{accountToDelete.name}"</strong> se archivará y dejará de aparecer en tus cuentas activas. Toda transacción previa se mantendrá intacta.
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
                {(() => {
                  if (!targetTransferAccountId) return null;
                  const destAccount = accounts.find((a) => a.id === targetTransferAccountId);
                  if (!destAccount || destAccount.currency === accountToDelete.currency) return null;
                  const estimatedConverted = convert(accountToDelete.balance, accountToDelete.currency, destAccount.currency);
                  return (
                    <div className="p-2 rounded-lg bg-gray-950/80 border border-gray-800 text-[11px] text-gray-300">
                      💡 Conversión estimada: Se transferirán <strong>{formatCurrency(accountToDelete.balance, accountToDelete.currency)}</strong> que equivalen aprox. a <strong className="text-emerald-400">{formatCurrency(estimatedConverted, destAccount.currency)}</strong> en la cuenta receptora.
                    </div>
                  );
                })()}
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
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeletingAccount || isCreatingTransfer || isDeletingLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archivar Cuenta</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Auth Gate Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        title={gateConfig.title}
        subtitle={gateConfig.subtitle}
      />
    </div>
  );
}
