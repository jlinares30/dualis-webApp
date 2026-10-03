'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  DollarSign, 
  Sparkles, 
  PieChart, 
  ShieldCheck, 
  Layers, 
  Coins,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  AlertTriangle,
  Search
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useInvestments, useUpdateInvestment, useDeleteInvestment, CreateInvestmentModal, InvestmentDTO } from '@/features/investments';
import { useAccounts, useCreateTransaction } from '@/hooks';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';
import { CustomExchangeRateInput } from '@/components/ui/custom-exchange-rate-input';

const COMMON_CURRENCIES = ['PEN', 'USD', 'EUR', 'COP', 'MXN', 'CLP', 'ARS', 'BRL'];

const getCurrencySymbol = (curr: string) => {
  return curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'PEN' ? 'S/' : curr;
};

export default function InvestmentsPage() {
  const { activeWorkspaceId, workspaces } = useWorkspaceStore();
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const currency = activeWs?.currency || 'PEN';
  const { convert } = useExchangeRateStore();
  const { data: apiInvestments, isLoading } = useInvestments();
  const { data: apiAccounts } = useAccounts();
  const { mutateAsync: updateInvMut, isPending: isUpdating } = useUpdateInvestment();
  const { mutateAsync: deleteInvMut, isPending: isDeleting } = useDeleteInvestment();
  const { mutateAsync: createTxMut } = useCreateTransaction();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para Actualizar Valorización / Editar
  const [editingInv, setEditingInv] = useState<InvestmentDTO | null>(null);
  const [editName, setEditName] = useState('');
  const [editInstitution, setEditInstitution] = useState('');
  const [editType, setEditType] = useState<string>('MUTUAL_FUNDS');
  const [editCurrentValue, setEditCurrentValue] = useState('');
  const [editInitialCapital, setEditInitialCapital] = useState('');
  const [editCurrency, setEditCurrency] = useState('PEN');
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Estado para Confirmación y Liquidación de Inversión
  const liquidAccounts = (apiAccounts || []).filter(
    (a) => a.status !== 'ARCHIVED' && a.type?.toUpperCase() !== 'INVESTMENT'
  );
  const [deletingInv, setDeletingInv] = useState<InvestmentDTO | null>(null);
  const [depositToAccountOnDelete, setDepositToAccountOnDelete] = useState(false);
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [liquidationCustomComputed, setLiquidationCustomComputed] = useState<number | null>(null);
  const [liquidationAppliedRate, setLiquidationAppliedRate] = useState<number | null>(null);

  // Filtro y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  const investments = apiInvestments || [];

  const filteredInvestments = investments.filter((inv) => {
    const matchesSearch =
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.institution && inv.institution.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedTypeFilter === 'ALL' || inv.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  // Convertir cada activo a la moneda base del espacio para calcular totales consolidados correctos
  const totalCapital = investments.reduce((acc, curr) => {
    const invCurrency = curr.currency || currency;
    const converted = convert(curr.initialCapital || 0, invCurrency, currency);
    return acc + converted;
  }, 0);

  const totalValue = investments.reduce((acc, curr) => {
    const invCurrency = curr.currency || currency;
    const rawVal = curr.currentValue ?? curr.initialCapital ?? 0;
    const converted = convert(rawVal, invCurrency, currency);
    return acc + converted;
  }, 0);

  const totalReturns = totalValue - totalCapital;
  const overallRoi = totalCapital > 0 ? (totalReturns / totalCapital) * 100 : 0;

  const handleOpenEdit = (inv: InvestmentDTO) => {
    setEditingInv(inv);
    setEditName(inv.name);
    setEditInstitution(inv.institution || '');
    setEditType(inv.type || 'MUTUAL_FUNDS');
    setEditCurrentValue((inv.currentValue ?? inv.initialCapital ?? 0).toString());
    setEditInitialCapital((inv.initialCapital ?? 0).toString());
    setEditCurrency(inv.currency || currency);
    setEditError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInv || !editName) return;

    setEditError(null);
    try {
      await updateInvMut({
        id: editingInv.id,
        data: {
          name: editName,
          institution: editInstitution || 'Entidad Financiera',
          type: editType,
          initialCapital: parseFloat(editInitialCapital) || 0,
          currentValue: parseFloat(editCurrentValue) || 0,
        },
      });
      setEditingInv(null);
    } catch (err: any) {
      console.error('Error al actualizar inversión:', err);
      setEditError(err?.message || 'Error al actualizar los datos de la inversión');
    }
  };

  const handleOpenDelete = (inv: InvestmentDTO) => {
    setDeletingInv(inv);
    // Sugerir cuenta que coincida con la moneda de la inversión
    const matching = liquidAccounts.find((a) => a.currency === inv.currency);
    setDestinationAccountId(matching ? matching.id : liquidAccounts[0]?.id || '');
    setDepositToAccountOnDelete(false);
    setLiquidationCustomComputed(null);
    setLiquidationAppliedRate(null);
    setDeleteError(null);
  };

  const handleDelete = async () => {
    if (!deletingInv) return;
    setDeleteError(null);
    try {
      const invCurrentVal = deletingInv.currentValue ?? deletingInv.initialCapital ?? 0;
      const targetAccount = liquidAccounts.find((a) => a.id === destinationAccountId);

      // 1. Eliminar primero la inversión para asegurar atomicidad e integridad
      await deleteInvMut(deletingInv.id);

      // 2. Si se eliminó exitosamente y se solicitó liquidar en cuenta bancaria, registrar el abono
      if (depositToAccountOnDelete && targetAccount && invCurrentVal > 0) {
        const invCurr = deletingInv.currency || currency;
        const targetCurr = targetAccount.currency || currency;
        const isCross = targetCurr !== invCurr;

        let depositVal = invCurrentVal;
        if (isCross) {
          depositVal = liquidationCustomComputed !== null
            ? liquidationCustomComputed
            : parseFloat(convert(invCurrentVal, invCurr, targetCurr).toFixed(2));
        }

        const effectiveRate = isCross
          ? (liquidationAppliedRate ?? (invCurrentVal > 0 ? parseFloat((depositVal / invCurrentVal).toFixed(6)) : undefined))
          : undefined;

        try {
          await createTxMut({
            workspaceId: targetAccount.workspaceId || activeWorkspaceId!,
            accountId: targetAccount.id,
            amount: depositVal,
            currency: targetCurr,
            type: 'INCOME',
            categoryNature: 'NON_ESSENTIAL',
            description: isCross && effectiveRate
              ? `Liquidación de inversión: ${deletingInv.name} (${deletingInv.institution || 'Portafolio'}) [TC: 1 ${invCurr} = ${effectiveRate} ${targetCurr}]`
              : `Liquidación de inversión: ${deletingInv.name} (${deletingInv.institution || 'Portafolio'})`,
            exchangeRate: effectiveRate,
            originalAmount: isCross ? invCurrentVal : undefined,
            originalCurrency: isCross ? invCurr : undefined,
            transactionDate: new Date().toISOString(),
          });
        } catch (txErr) {
          console.error('Error al registrar transacción de rescate/liquidación:', txErr);
        }
      }

      setDeletingInv(null);
    } catch (err: any) {
      console.error('Error al eliminar inversión:', err);
      setDeleteError(err?.message || 'No se pudo eliminar la inversión. Intenta nuevamente.');
    }
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Portafolio de Inversiones
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Gestión de Inversiones
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Monitorea el crecimiento de tus activos, fondos mutuos, acciones y criptomonedas.
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Registrar Inversión
        </button>
      </div>

      {/* Global Portfolio Summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/40 via-gray-900 to-indigo-950/30 border border-emerald-500/20 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Valor Total del Portafolio
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-1">
              {formatCurrency(totalValue, currency)}
            </h2>
            <div className="flex items-center gap-3 mt-2 text-xs font-medium">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${totalReturns >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                <ArrowUpRight className="w-3.5 h-3.5" />
                {totalReturns >= 0 ? '+' : ''}{formatCurrency(totalReturns, currency)} ({overallRoi.toFixed(2)}% ROI)
              </span>
              <span className="text-gray-400">Capital aportado: {formatCurrency(totalCapital, currency)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-2xl bg-gray-900/80 border border-gray-800 text-center">
              <span className="block text-[10px] text-gray-400 uppercase font-semibold">Activos Registrados</span>
              <span className="text-sm font-bold text-white">{investments.length}</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-gray-900/80 border border-gray-800 text-center">
              <span className="block text-[10px] text-gray-400 uppercase font-semibold">Rendimiento Promedio</span>
              <span className={`text-sm font-bold ${overallRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {overallRoi >= 0 ? '+' : ''}{overallRoi.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      {investments.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'MUTUAL_FUNDS', label: 'Fondos' },
              { id: 'FIXED_TERM', label: 'Plazo Fijo' },
              { id: 'STOCKS', label: 'Acciones/ETFs' },
              { id: 'CRYPTO', label: 'Cripto' },
              { id: 'CROWDLENDING', label: 'Facturas' },
              { id: 'REAL_ESTATE', label: 'Inmuebles' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTypeFilter === tab.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow'
                    : 'bg-gray-900/80 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o banco..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Grid of Investment Assets */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-[#0f172a]/60 animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : investments.length === 0 ? (
        <div className="text-center py-12 rounded-3xl bg-[#0f172a]/40 border border-gray-800/40 border-dashed space-y-3">
          <TrendingUp className="w-10 h-10 text-gray-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-gray-300">No tienes inversiones registradas aún</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Registra tu primer plazo fijo, fondo mutuo o portafolio de criptos para medir tus ganancias.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Registrar mi primera inversión
          </button>
        </div>
      ) : filteredInvestments.length === 0 ? (
        <div className="text-center py-10 rounded-2xl bg-[#0f172a]/40 border border-gray-800/40 space-y-2">
          <Search className="w-8 h-8 text-gray-500 mx-auto" />
          <h3 className="font-bold text-xs text-gray-300">No se encontraron inversiones con esos criterios</h3>
          <p className="text-[11px] text-gray-500">Prueba ajustando el texto de búsqueda o el filtro de categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInvestments.map((inv) => {
            const invCurrency = inv.currency || currency;
            const capital = inv.initialCapital || 0;
            const current = inv.currentValue ?? capital;
            const gain = current - capital;
            const roi = capital > 0 ? (gain / capital) * 100 : 0;

            return (
              <div
                key={inv.id}
                className="relative overflow-hidden rounded-2xl bg-[#0f172a]/90 border border-gray-800/80 p-5 shadow-lg hover:border-gray-700 transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-md">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                        {inv.type}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                        {invCurrency}
                      </span>
                    </div>

                    {/* Botones de Acción: Editar/Actualizar y Eliminar */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(inv)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                        title="Actualizar valorización"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(inv)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Eliminar o liquidar inversión"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors truncate">
                      {inv.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {inv.institution || 'Entidad Financiera'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-800/80 space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-gray-400">Valor Actual</span>
                    <div className="text-right">
                      <span className="font-bold text-base text-white font-mono block">
                        {formatCurrency(current, invCurrency)}
                      </span>
                      {invCurrency !== currency && (
                        <span className="text-[10px] text-gray-500 font-mono">
                          ≈ {formatCurrency(convert(current, invCurrency, currency), currency)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500">Capital: {formatCurrency(capital, invCurrency)}</span>
                    <span className={`font-semibold font-mono ${gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {gain >= 0 ? '+' : ''}{formatCurrency(gain, invCurrency)} ({roi.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear */}
      <CreateInvestmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Modal Actualizar Valorización / Editar */}
      {editingInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative w-full max-w-md bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setEditingInv(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Actualizar Inversión</h3>
                <p className="text-xs text-gray-400">Ajusta el valor de mercado o capital invertido</p>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Plataforma / Banco</label>
                  <input
                    type="text"
                    value={editInstitution}
                    onChange={(e) => setEditInstitution(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Moneda del Activo</label>
                  <div className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-300 font-mono font-semibold flex items-center justify-between cursor-not-allowed select-none">
                    <span>{editCurrency} ({getCurrencySymbol(editCurrency)})</span>
                    <span className="text-[10px] text-gray-500 font-sans font-normal">Fija</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Capital Invertido ({getCurrencySymbol(editCurrency)})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editInitialCapital}
                    onChange={(e) => setEditInitialCapital(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Valor Actual ({getCurrencySymbol(editCurrency)})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editCurrentValue}
                    onChange={(e) => setEditCurrentValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-emerald-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Tipo de Activo</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="MUTUAL_FUNDS">Fondos Mutuos</option>
                  <option value="FIXED_TERM">Plazo Fijo</option>
                  <option value="STOCKS">Acciones / ETFs</option>
                  <option value="CRYPTO">Criptomonedas</option>
                  <option value="CROWDLENDING">Facturaje / Facturas</option>
                  <option value="REAL_ESTATE">Bienes Raíces</option>
                </select>
              </div>

              {editError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  {editError}
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingInv(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación y Liquidación de Inversión */}
      {deletingInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative w-full max-w-md bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-base text-white">Retirar o Liquidar Inversión</h3>
                <p className="text-xs text-gray-400">
                  {deletingInv.name} ({formatCurrency(deletingInv.currentValue ?? deletingInv.initialCapital ?? 0, deletingInv.currency || currency)})
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-left">
              ¿Deseas cerrar esta inversión? Puedes transferir el valor liquidado directamente a una de tus cuentas bancarias como ingreso, o simplemente darla de baja del portafolio.
            </p>

            {/* Opción de depositar fondos en cuenta bancaria */}
            <div className="p-3.5 rounded-2xl bg-gray-900 border border-gray-800 space-y-2 text-left">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={depositToAccountOnDelete}
                  onChange={(e) => setDepositToAccountOnDelete(e.target.checked)}
                  className="rounded border-gray-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Liquidar y depositar fondos en una cuenta bancaria</span>
              </label>

              {depositToAccountOnDelete && (
                <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                  <label className="block text-[11px] text-gray-400">Cuenta de destino:</label>
                  <select
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {liquidAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency || currency}) - Saldo: {acc.balance.toLocaleString()} {acc.currency || currency}
                      </option>
                    ))}
                  </select>

                  {/* Previsualización de conversión de divisa en liquidación con tipo de cambio editable */}
                  {(() => {
                    const targetAcc = liquidAccounts.find((a) => a.id === destinationAccountId);
                    const invCurr = deletingInv.currency || currency;
                    const targetCurr = targetAcc?.currency || currency;
                    const invVal = deletingInv.currentValue ?? deletingInv.initialCapital ?? 0;
                    const isCross = targetCurr !== invCurr;
                    const convertedVal = isCross
                      ? (liquidationCustomComputed !== null ? liquidationCustomComputed : convert(invVal, invCurr, targetCurr))
                      : invVal;

                    return (
                      <div className="space-y-2 pt-1">
                        {isCross && (
                          <CustomExchangeRateInput
                            sourceCurrency={invCurr}
                            targetCurrency={targetCurr}
                            sourceAmount={invVal}
                            accentColor="emerald"
                            onRateChange={(rate, computed) => {
                              setLiquidationAppliedRate(rate);
                              setLiquidationCustomComputed(computed);
                            }}
                          />
                        )}

                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                          <span>Se abonará a tu cuenta:</span>
                          <span className="font-bold font-mono">
                            {formatCurrency(convertedVal, targetCurr)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 text-left">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingInv(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-rose-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDeleting ? 'Procesando...' : depositToAccountOnDelete ? 'Liquidar y Retirar' : 'Eliminar Registro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
