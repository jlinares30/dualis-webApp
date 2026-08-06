'use client';

import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Utensils, 
  Zap, 
  Tv, 
  Home, 
  Car, 
  ShoppingBag, 
  Users, 
  User,
  Download
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { WorkspaceType, CategoryType, Transaction } from '@/types/finance';
import { CreateTransactionModal } from '@/components/modals/create-transaction-modal';

const mockAllTransactions: Transaction[] = [
  {
    id: 'tx-1',
    title: 'Supermercado Metro / Tottus',
    category: 'food',
    categoryLabel: 'Alimentación',
    amount: 185,
    currency: 'PEN',
    date: '05 Aug 2026, 10:30 AM',
    type: 'expense',
    workspace: 'couple',
    paidBy: 'Jorge',
    splitRatio: '50/50',
  },
  {
    id: 'tx-2',
    title: 'Servicio de Luz Luz del Sur / Enel',
    category: 'utilities',
    categoryLabel: 'Servicios',
    amount: 120,
    currency: 'PEN',
    date: '04 Aug 2026',
    type: 'expense',
    workspace: 'couple',
    paidBy: 'Sofía',
    splitRatio: '50/50',
  },
  {
    id: 'tx-3',
    title: 'Suscripción Netflix & Spotify',
    category: 'entertainment',
    categoryLabel: 'Entretenimiento',
    amount: 45,
    currency: 'PEN',
    date: '01 Aug 2026',
    type: 'expense',
    workspace: 'personal',
  },
  {
    id: 'tx-4',
    title: 'Transferencia Nómina Empresa',
    category: 'income',
    categoryLabel: 'Ingreso',
    amount: 3800,
    currency: 'PEN',
    date: '30 Jul 2026',
    type: 'income',
    workspace: 'personal',
  },
  {
    id: 'tx-5',
    title: 'Cena Restaurante Chifa / Pardos',
    category: 'food',
    categoryLabel: 'Alimentación',
    amount: 95,
    currency: 'PEN',
    date: '28 Jul 2026',
    type: 'expense',
    workspace: 'couple',
    paidBy: 'Jorge',
    splitRatio: '50/50',
  },
  {
    id: 'tx-6',
    title: 'Mantenimiento Vehículo',
    category: 'transport',
    categoryLabel: 'Transporte',
    amount: 210,
    currency: 'PEN',
    date: '25 Jul 2026',
    type: 'expense',
    workspace: 'personal',
  },
];

const categoryIconMap: Record<CategoryType, React.ComponentType<{ className?: string }>> = {
  food: Utensils,
  utilities: Zap,
  entertainment: Tv,
  housing: Home,
  transport: Car,
  shopping: ShoppingBag,
  health: ShoppingBag,
  income: ArrowDownLeft,
};

export default function TransactionsPage({ workspace = 'couple' }: { workspace?: WorkspaceType }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = mockAllTransactions.filter((tx) => {
    const matchesWorkspace = workspace === 'couple' ? tx.workspace === 'couple' : true;
    const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || tx.type === selectedType;
    return matchesWorkspace && matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1">
              <Receipt className="w-3 h-3" /> Historial de Movimientos
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Transacciones
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Registro detallado de todos los ingresos y gastos registrados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 text-xs font-semibold transition-all cursor-pointer">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Registrar Movimiento
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0f172a]/90 border border-gray-800/80">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por concepto..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Type selector */}
        <div className="flex items-center gap-1 bg-gray-900/90 p-1 rounded-xl border border-gray-800 w-full md:w-auto">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedType === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedType('expense')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedType === 'expense' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Gastos
          </button>
          <button
            onClick={() => setSelectedType('income')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedType === 'income' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Ingresos
          </button>
        </div>
      </div>

      {/* Table / List */}
      <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 overflow-hidden shadow-xl">
        <div className="divide-y divide-gray-800/60">
          {filtered.map((tx) => {
            const CategoryIcon = categoryIconMap[tx.category] || Utensils;
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 hover:bg-gray-900/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-300">
                    <CategoryIcon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{tx.title}</span>
                      {tx.workspace === 'couple' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          <Users className="w-3 h-3" /> Shared {tx.splitRatio}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md">
                          <User className="w-3 h-3" /> Personal
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span>{tx.categoryLabel}</span>
                      <span>•</span>
                      <span>{tx.date}</span>
                      {tx.paidBy && (
                        <>
                          <span>•</span>
                          <span className="text-gray-300">Pagado por {tx.paidBy}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-bold text-base block ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
                    {isIncome ? '+' : '-'} {formatCurrency(tx.amount, tx.currency)}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    Completado
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      <CreateTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
