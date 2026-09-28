'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Receipt, 
  Search, 
  Plus, 
  Users, 
  User, 
  Download,
  Filter,
  X,
  Wallet,
  Trash2,
  AlertTriangle,
  ArrowRightLeft,
  CreditCard,
  Calendar,
  FileSpreadsheet,
  Pencil
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { WorkspaceType } from '@/types';
import { useTransactions, useDeleteTransaction, CreateTransactionModal, Transaction, getTransactionsByWorkspace } from '@/features/transactions';
import { useAccounts } from '@/features/accounts';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { getTransactionIconAndStyle } from '@/lib/transaction-icons';

export default function TransactionsPage({ workspace }: { workspace?: WorkspaceType }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountIdParam = searchParams.get('accountId') || undefined;

  const { hasPartner, activeWorkspaceType, activeWorkspaceId, workspaces } = useWorkspaceStore();
  const { data: accountsList } = useAccounts();
  const currentWorkspace = workspace || (activeWorkspaceType === 'COUPLE' || activeWorkspaceType === 'couple' ? 'couple' : 'personal');
  const isCoupleActive = hasPartner && currentWorkspace === 'couple';

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(accountIdParam);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 15;

  const { mutateAsync: deleteTxMut, isPending: isDeletingTx } = useDeleteTransaction();

  // Debounce para no saturar peticiones mientras escribe en el buscador
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sincronizar si cambia el parámetro de URL
  React.useEffect(() => {
    setSelectedAccountId(accountIdParam);
    setCurrentPage(0);
  }, [accountIdParam]);

  const apiTypeFilter = selectedType === 'income' ? 'INCOME' : selectedType === 'expense' ? 'EXPENSE' : selectedType === 'transfer' ? 'TRANSFER' : undefined;
  const apiStartDate = startDate ? `${startDate}T00:00:00Z` : undefined;
  const apiEndDate = endDate ? `${endDate}T23:59:59Z` : undefined;

  const { data: pageData, isLoading } = useTransactions(
    currentPage,
    pageSize,
    selectedAccountId,
    apiTypeFilter,
    debouncedSearch || undefined,
    apiStartDate,
    apiEndDate
  );

  const activeFilteredAccount = accountsList?.find((a) => a.id === selectedAccountId);

  // Función de Exportación a CSV con formato RFC4180 y BOM UTF-8 para Excel
  const handleExportCSV = async () => {
    if (!activeWorkspaceId) return;
    setIsExporting(true);
    try {
      // Obtenemos el histórico de transacciones del workspace
      const allTx = await getTransactionsByWorkspace(activeWorkspaceId);

      // Aplicar filtros locales si el usuario tiene activos cuenta, tipo, búsqueda o fechas
      const filtered = allTx.filter((tx) => {
        if (selectedAccountId && tx.accountId !== selectedAccountId) return false;
        if (apiTypeFilter && tx.type !== apiTypeFilter) return false;
        if (debouncedSearch) {
          const s = debouncedSearch.toLowerCase();
          const matchTitle = tx.description?.toLowerCase().includes(s);
          const matchCat = tx.categoryName?.toLowerCase().includes(s);
          if (!matchTitle && !matchCat) return false;
        }
        if (startDate && tx.transactionDate) {
          if (new Date(tx.transactionDate) < new Date(`${startDate}T00:00:00`)) return false;
        }
        if (endDate && tx.transactionDate) {
          if (new Date(tx.transactionDate) > new Date(`${endDate}T23:59:59`)) return false;
        }
        return true;
      });

      // Encabezados
      const headers = ['Fecha', 'Descripción', 'Tipo', 'Categoría', 'Cuenta', 'Moneda', 'Monto', 'Registrado por'];

      const escapeCSV = (val: string | number | null | undefined) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = filtered.map((tx) => {
        const txDate = tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString('es-PE') : '';
        const matchingAcc = accountsList?.find((a) => a.id === tx.accountId);
        const accName = tx.accountName || matchingAcc?.name || 'Cuenta General';
        const typeStr = tx.type === 'INCOME' ? 'Ingreso' : tx.type === 'EXPENSE' ? 'Gasto' : 'Transferencia';
        return [
          escapeCSV(txDate),
          escapeCSV(tx.description || 'Sin concepto'),
          escapeCSV(typeStr),
          escapeCSV(tx.categoryName || 'General'),
          escapeCSV(accName),
          escapeCSV(tx.currency || 'PEN'),
          escapeCSV(tx.amount.toFixed(2)),
          escapeCSV(tx.paidByUserName || 'Yo')
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileName = `dualis-transacciones-${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al exportar CSV:', err);
      alert('Hubo un error al generar la exportación CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const allTransactions: Transaction[] = pageData?.content
    ? pageData.content.map((dto) => {
        const txWs = workspaces.find((w) => w.id === dto.workspaceId);
        const isTxCouple = txWs?.type === 'COUPLE' || (txWs?.type as any) === 'couple' || isCoupleActive;
        const matchingAccount = accountsList?.find((a) => a.id === dto.accountId);
        const matchingTargetAccount = accountsList?.find((a) => a.id === dto.targetAccountId);
        const txType = dto.type === 'TRANSFER' ? 'transfer' : dto.type === 'INCOME' ? 'income' : 'expense';

        return {
          id: dto.id,
          title: dto.description || 'Sin concepto',
          category: (dto.categoryName as any) || 'General',
          categoryLabel: dto.type === 'TRANSFER' ? 'Transferencia' : (dto.categoryName || 'General'),
          categoryId: dto.categoryId,
          amount: dto.amount,
          currency: dto.currency || 'PEN',
          date: dto.transactionDate ? new Date(dto.transactionDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Hoy',
          rawDate: dto.transactionDate,
          type: txType,
          workspace: isTxCouple ? 'couple' : 'personal',
          accountId: dto.accountId,
          accountName: dto.accountName || matchingAccount?.name,
          targetAccountId: dto.targetAccountId,
          targetAccountName: dto.targetAccountName || matchingTargetAccount?.name,
          paidBy: dto.paidByUserName,
        };
      })
    : [];

  const totalPages = pageData?.totalPages || 1;

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
          <button 
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Exportar listado actual a archivo CSV para Excel"
          >
            {isExporting ? (
              <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            )}
            <span>{isExporting ? 'Exportando...' : 'Exportar CSV'}</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Registrar Movimiento
          </button>
        </div>
      </div>

      {/* Active Account Filter Banner */}
      {selectedAccountId && activeFilteredAccount && (
        <div className="flex items-center justify-between p-3 px-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 animate-in fade-in-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-indigo-300 font-semibold flex items-center gap-1.5">
                <span>Filtrando movimientos de la cuenta:</span>
                <span className="font-bold text-white bg-indigo-600/30 px-2 py-0.5 rounded-lg border border-indigo-500/30">
                  {activeFilteredAccount.name}
                </span>
                <span className="text-[11px] text-gray-400">({activeFilteredAccount.currency})</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Mostrando únicamente las transacciones asociadas a esta fuente de dinero.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedAccountId(undefined);
              router.push('/transactions');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-semibold border border-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Ver todas</span>
          </button>
        </div>
      )}

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

        {/* Cuenta selector opcional si hay cuentas */}
        {accountsList && accountsList.length > 0 && (
          <div className="w-full md:w-auto">
            <select
              value={selectedAccountId || ''}
              onChange={(e) => {
                const val = e.target.value || undefined;
                setSelectedAccountId(val);
                setCurrentPage(0);
                if (val) {
                  router.push(`/transactions?accountId=${val}`);
                } else {
                  router.push('/transactions');
                }
              }}
              className="w-full md:w-auto px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-200 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Todas las cuentas</option>
              {accountsList
                .filter((a) => a.status !== 'ARCHIVED')
                .map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Type selector */}
        <div className="flex items-center gap-1 bg-gray-900/90 p-1 rounded-xl border border-gray-800 w-full md:w-auto">
          <button
            onClick={() => { setSelectedType('all'); setCurrentPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedType === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => { setSelectedType('expense'); setCurrentPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedType === 'expense' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Gastos
          </button>
          <button
            onClick={() => { setSelectedType('income'); setCurrentPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedType === 'income' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Ingresos
          </button>
          <button
            onClick={() => { setSelectedType('transfer'); setCurrentPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              selectedType === 'transfer' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Transferencias</span>
          </button>
        </div>

        {/* Date Range Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto bg-gray-900/90 p-1.5 px-3 rounded-xl border border-gray-800 text-xs">
          <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <div className="flex items-center gap-1.5 text-gray-400">
            <span className="text-[11px] font-medium text-gray-400">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(0);
              }}
              className="bg-transparent border-0 text-white text-xs outline-none cursor-pointer [color-scheme:dark]"
            />
            <span className="text-[11px] font-medium text-gray-400">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(0);
              }}
              className="bg-transparent border-0 text-white text-xs outline-none cursor-pointer [color-scheme:dark]"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(0);
                }}
                className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded transition-colors"
                title="Limpiar rango de fechas"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table / List */}
      <div className="rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-900/60 animate-pulse border border-gray-800/50" />
            ))}
          </div>
        ) : allTransactions.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Receipt className="w-10 h-10 text-gray-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-gray-300">No hay transacciones que mostrar</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {searchTerm || selectedType !== 'all'
                  ? 'Prueba cambiando los filtros de búsqueda.'
                  : 'Presiona "Registrar Movimiento" para agregar tu primer ingreso o gasto.'}
              </p>
            </div>
            {!searchTerm && selectedType === 'all' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-semibold hover:bg-indigo-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Registrar mi primera transacción
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {allTransactions.map((tx) => {
              const { Icon, badgeClass } = getTransactionIconAndStyle(tx.type, tx.categoryLabel, tx.title);
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-900/40 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl border ${badgeClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{tx.title}</span>
                        {hasPartner && tx.workspace === 'couple' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            <Users className="w-3 h-3" /> Compartido Pareja
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md">
                            <User className="w-3 h-3" /> Personal
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                        <span>{tx.categoryLabel}</span>
                        <span>•</span>
                        <span>{tx.date}</span>
                        {tx.type === 'transfer' ? (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-medium text-indigo-300">
                              <Wallet className="w-2.5 h-2.5 text-indigo-400" />
                              {tx.accountName || 'Origen'} ➔ {tx.targetAccountName || 'Destino'}
                            </span>
                          </>
                        ) : tx.accountName && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-900 border border-gray-800 text-[11px] font-medium text-gray-300">
                              <Wallet className="w-2.5 h-2.5 text-indigo-400" />
                              {tx.accountName}
                            </span>
                          </>
                        )}
                        {hasPartner && tx.paidBy && (
                          <>
                            <span>•</span>
                            <span className="text-gray-300">Pagado por {tx.paidBy}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`font-bold text-base block ${
                        tx.type === 'transfer'
                          ? 'text-indigo-400'
                          : isIncome
                            ? 'text-emerald-400'
                            : 'text-white'
                      }`}>
                        {tx.type === 'transfer' ? '↔' : isIncome ? '+' : '-'} {formatCurrency(tx.amount, tx.currency)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setTransactionToEdit(tx);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all cursor-pointer"
                        title="Editar transacción"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setTransactionToDelete(tx)}
                        className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                        title="Eliminar movimiento y revertir saldo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginador */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-800/80 bg-gray-900/30 text-xs">
            <span className="text-gray-400">
              Página <strong className="text-white">{currentPage + 1}</strong> de <strong className="text-white">{totalPages}</strong>
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-700 transition cursor-pointer"
              >
                Anterior
              </button>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-700 transition cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <CreateTransactionModal
        isOpen={isModalOpen}
        transactionToEdit={transactionToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setTransactionToEdit(null);
        }}
      />

      {/* Modal Confirmar Eliminación de Transacción */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative w-full max-w-sm bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">¿Eliminar Movimiento?</h3>
                <p className="text-xs text-gray-400">El saldo afectado se revertirá automáticamente</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-900 border border-gray-800 space-y-1">
              <span className="text-xs font-bold text-white block">{transactionToDelete.title}</span>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{transactionToDelete.categoryLabel}</span>
                <span className={`font-bold ${transactionToDelete.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                  {transactionToDelete.type === 'income' ? '+' : '-'} {formatCurrency(transactionToDelete.amount, transactionToDelete.currency)}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Al eliminar este registro, el dinero se restituirá a la cuenta correspondiente ({transactionToDelete.accountName || 'cuenta de origen'}).
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTransactionToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeletingTx}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setDeleteError(null);
                  try {
                    await deleteTxMut(transactionToDelete.id);
                    setTransactionToDelete(null);
                  } catch (delErr: any) {
                    console.error('Error al eliminar transacción:', delErr);
                    setDeleteError(delErr?.message || 'Error al eliminar el movimiento.');
                  }
                }}
                disabled={isDeletingTx}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeletingTx ? (
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

