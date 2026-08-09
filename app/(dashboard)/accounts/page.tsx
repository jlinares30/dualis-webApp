'use client';

import React, { useState } from 'react';
import { 
  Wallet, 
  CreditCard, 
  Landmark, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  TrendingUp,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { WorkspaceType } from '@/types/finance';
import { CreateAccountModal } from '@/components/modals/create-account-modal';
import { useAccounts } from '@/hooks/useAccounts';

interface AccountItem {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit' | 'digital';
  balance: number;
  currency: string;
  accountNumber?: string;
  color: string;
  workspace: 'personal' | 'couple';
}

const mockAccounts: AccountItem[] = [
  {
    id: 'acc-1',
    name: 'BCP / Yape Principal',
    type: 'digital',
    balance: 1450,
    currency: 'PEN',
    accountNumber: '*4821',
    color: 'from-purple-600 to-indigo-600',
    workspace: 'personal',
  },
  {
    id: 'acc-2',
    name: 'BBVA Ahorros (Pareja)',
    type: 'bank',
    balance: 3400,
    currency: 'PEN',
    accountNumber: '*9012',
    color: 'from-emerald-600 to-teal-600',
    workspace: 'couple',
  },
  {
    id: 'acc-3',
    name: 'Tarjeta de Crédito Interbank',
    type: 'credit',
    balance: -680,
    currency: 'PEN',
    accountNumber: '*1154',
    color: 'from-rose-600 to-pink-600',
    workspace: 'personal',
  },
  {
    id: 'acc-4',
    name: 'Efectivo Caja Menor',
    type: 'cash',
    balance: 250,
    currency: 'PEN',
    color: 'from-amber-600 to-yellow-600',
    workspace: 'couple',
  },
];

export default function AccountsPage({ workspace = 'personal' }: { workspace?: WorkspaceType }) {
  const { data: apiAccounts, isLoading } = useAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const accounts: AccountItem[] = apiAccounts
    ? apiAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: (a.type?.toLowerCase() as any) || 'bank',
        balance: a.balance,
        currency: a.currency || 'PEN',
        accountNumber: a.accountNumber,
        color: a.color || 'from-indigo-600 to-blue-600',
        workspace: 'personal',
      }))
    : [];

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

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
            Administra tus fuentes de dinero, bancos y tarjetas de crédito.
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/40 via-gray-900 to-emerald-950/30 border border-indigo-500/20 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Patrimonio en Cuentas
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-1">
              {formatCurrency(totalBalance, 'PEN')}
            </h2>
            <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Saldo total disponible entre {accounts.length} cuentas activas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-2xl bg-gray-900/80 border border-gray-800 text-center">
              <span className="block text-[10px] text-gray-400 uppercase font-semibold">Cuentas Débito</span>
              <span className="text-sm font-bold text-emerald-400">
                {formatCurrency(accounts.filter(a => a.balance > 0).reduce((acc, c) => acc + c.balance, 0), 'PEN')}
              </span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-gray-900/80 border border-gray-800 text-center">
              <span className="block text-[10px] text-gray-400 uppercase font-semibold">Pasivos / Crédito</span>
              <span className="text-sm font-bold text-rose-400">
                {formatCurrency(Math.abs(accounts.filter(a => a.balance < 0).reduce((acc, c) => acc + c.balance, 0)), 'PEN')}
              </span>
            </div>
          </div>
        </div>
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

                  <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                    {acc.type}
                  </span>
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
                  <span className={`font-bold text-lg ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatCurrency(acc.balance, acc.currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <CreateAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
