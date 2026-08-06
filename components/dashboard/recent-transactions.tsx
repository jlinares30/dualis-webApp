import React from 'react';
import { 
  Utensils, 
  Zap, 
  Tv, 
  Home, 
  Car, 
  ShoppingBag, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Users, 
  User
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { WorkspaceType, CategoryType, Transaction } from '@/types/finance';
import { useTransactions } from '@/hooks/useTransactions';

interface RecentTransactionsProps {
  workspace: WorkspaceType;
}

const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    title: 'Supermercado Metro / Tottus',
    category: 'food',
    categoryLabel: 'Alimentación',
    amount: 185,
    currency: 'PEN',
    date: 'Hoy, 10:30 AM',
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
    date: 'Ayer',
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
    date: '22 Jul',
    type: 'expense',
    workspace: 'personal',
  },
  {
    id: 'tx-4',
    title: 'Transferencia Nómina',
    category: 'income',
    categoryLabel: 'Ingreso',
    amount: 3800,
    currency: 'PEN',
    date: '15 Jul',
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
    date: '14 Jul',
    type: 'expense',
    workspace: 'couple',
    paidBy: 'Jorge',
    splitRatio: '50/50',
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

const categoryColorMap: Record<CategoryType, string> = {
  food: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  utilities: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  entertainment: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  housing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  transport: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  shopping: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  health: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  income: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export function RecentTransactions({ workspace }: RecentTransactionsProps) {
  const { data: pageData, isLoading } = useTransactions(0, 5);

  const transactions: Transaction[] = pageData?.content
    ? pageData.content.map((dto) => ({
        id: dto.id,
        title: dto.description || 'Sin concepto',
        category: (dto.categoryName?.toLowerCase() as CategoryType) || 'food',
        categoryLabel: dto.categoryName || 'General',
        amount: dto.amount,
        currency: dto.currency || 'PEN',
        date: dto.transactionDate ? new Date(dto.transactionDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : 'Hoy',
        type: dto.type === 'INCOME' ? 'income' : 'expense',
        workspace: 'personal',
        paidBy: dto.paidByUserName,
      }))
    : [];

  return (
    <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base text-white">Últimos Movimientos</h3>
          <p className="text-xs text-gray-400">Historial reciente de gastos e ingresos</p>
        </div>
        <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">
          Ver todo
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-900/60 animate-pulse border border-gray-800/50" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500">
            No tienes transacciones registradas aún.
          </div>
        ) : (
          transactions.map((tx) => {
            const CategoryIcon = categoryIconMap[tx.category] || Utensils;
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-900/60 border border-gray-800/50 hover:border-gray-700/80 transition-all duration-200"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl border ${categoryColorMap[tx.category] || categoryColorMap.food}`}>
                    <CategoryIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-100">{tx.title}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md">
                        <User className="w-3 h-3" /> Personal
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{tx.categoryLabel || tx.category}</span>
                      <span>•</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-bold text-sm block ${
                      isIncome ? 'text-emerald-400' : 'text-gray-100'
                    }`}
                  >
                    {isIncome ? '+' : '-'} {formatCurrency(tx.amount, tx.currency || 'PEN')}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">Exitoso</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
