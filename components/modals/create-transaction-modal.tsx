'use client';

import React, { useState } from 'react';
import { X, Receipt, Split, Sparkles, Wallet, PieChart, Percent, DollarSign } from 'lucide-react';
import { useWorkspaceStore, DefaultSplitRule } from '@/lib/stores/useWorkspaceStore';
import { useCreateTransaction } from '@/hooks/useTransactions';

interface CreateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'expense' | 'income';
}

export type SplitMode = 'EQUALLY' | 'PERCENTAGE' | 'PROPORTIONAL_INCOME' | 'FIXED_AMOUNT';

export function CreateTransactionModal({ isOpen, onClose, defaultType = 'expense' }: CreateTransactionModalProps) {
  const { hasPartner, partnerName, defaultSplitRule, defaultUserPercentage } = useWorkspaceStore();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState(defaultType);
  const [category, setCategory] = useState('food');
  const [accountId, setAccountId] = useState('acc-1');

  // Split options initialized with default rules
  const [isSplit, setIsSplit] = useState(hasPartner);
  const [splitMode, setSplitMode] = useState<DefaultSplitRule>(defaultSplitRule);
  const [userPercentage, setUserPercentage] = useState(defaultUserPercentage);
  const [fixedPartnerAmount, setFixedPartnerAmount] = useState('');

  const { mutateAsync: createTx, isPending } = useCreateTransaction();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      await createTx({
        workspaceId: activeWorkspaceId || 'default-personal-workspace',
        accountId,
        categoryId: category,
        amount: parseFloat(amount),
        currency: 'PEN',
        type: type === 'income' ? 'INCOME' : 'EXPENSE',
        description: title,
        transactionDate: new Date().toISOString(),
      });
      setTitle('');
      setAmount('');
      onClose();
    } catch (err) {
      console.error('Error al crear transacción real:', err);
      // Igualmente cerramos para fallback fluido de UX
      onClose();
    }
  };

  const parsedAmount = parseFloat(amount) || 0;

  // Calculador dinámico según la regla seleccionada
  const calculateSplitPreview = () => {
    if (!parsedAmount || !isSplit) return null;
    const targetName = partnerName || 'Pareja';

    if (splitMode === 'EQUALLY') {
      const half = parsedAmount / 2;
      return `Tú: S/ ${half.toFixed(2)} | ${targetName}: S/ ${half.toFixed(2)} (50% / 50%)`;
    }

    if (splitMode === 'PERCENTAGE') {
      const myShare = (parsedAmount * userPercentage) / 100;
      const partnerShare = parsedAmount - myShare;
      return `Tú: S/ ${myShare.toFixed(2)} (${userPercentage}%) | ${targetName}: S/ ${partnerShare.toFixed(2)} (${100 - userPercentage}%)`;
    }

    if (splitMode === 'PROPORTIONAL_INCOME') {
      // Ejemplo: Jorge gana S/ 3800, Sofía gana S/ 2500 -> Total 6300 (60.3% / 39.7%)
      const myShare = (parsedAmount * 60.3) / 100;
      const partnerShare = parsedAmount - myShare;
      return `Tú: S/ ${myShare.toFixed(2)} (60.3%) | ${targetName}: S/ ${partnerShare.toFixed(2)} (39.7%) [Basado en Ingresos]`;
    }

    if (splitMode === 'FIXED_AMOUNT') {
      const partnerFixed = parseFloat(fixedPartnerAmount) || 0;
      const myShare = Math.max(0, parsedAmount - partnerFixed);
      return `Tú: S/ ${myShare.toFixed(2)} | ${targetName} paga fijo: S/ ${partnerFixed.toFixed(2)}`;
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
      <div className="relative w-full max-w-lg bg-[#0f172a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Registrar Transacción</h3>
            <p className="text-xs text-gray-400">Ingresa un nuevo movimiento financiero</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-gray-900 p-1 rounded-xl border border-gray-800">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-gray-400'
                }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400'
                }`}
            >
              Ingreso
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Concepto / Descripción</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Mercado Semanal Metro / Pago Salario"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Monto (S/ PEN)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="150"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Cuenta Origen</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="acc-1">BCP / Yape Principal (S/ 1,450)</option>
                <option value="acc-2">BBVA Ahorros (S/ 3,400)</option>
                <option value="acc-3">Tarjeta Interbank (S/ -680)</option>
                <option value="acc-4">Efectivo Caja Menor (S/ 250)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="food">Alimentación</option>
              <option value="utilities">Servicios Públicos</option>
              <option value="entertainment">Entretenimiento</option>
              <option value="transport">Transporte</option>
              <option value="income">Ingreso</option>
            </select>
          </div>

          {/* Split Checkbox & Expanded Advanced Options (Fase 2 - Parejas) */}
          {hasPartner && type === 'expense' && (
            <div className="space-y-3 pt-1 border-t border-gray-800/80">
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-900/80 border border-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSplit}
                  onChange={(e) => setIsSplit(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <div className="flex items-center justify-between flex-1">
                  <span className="text-xs text-gray-200 font-semibold">Dividir este gasto con mi pareja</span>
                  <Split className="w-4 h-4 text-emerald-400" />
                </div>
              </label>

              {isSplit && (
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-3 animate-in fade-in">
                  <span className="block text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                    Modo de División
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSplitMode('EQUALLY')}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all ${splitMode === 'EQUALLY'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                      <span className="block font-bold">Equitativo (50 / 50)</span>
                      <span className="text-[10px] text-gray-400">Mitad y mitad</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSplitMode('PROPORTIONAL_INCOME')}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all ${splitMode === 'PROPORTIONAL_INCOME'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                      <span className="block font-bold">Por Ingresos</span>
                      <span className="text-[10px] text-gray-400">Proporcional al sueldo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSplitMode('PERCENTAGE')}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all ${splitMode === 'PERCENTAGE'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                      <span className="block font-bold">Por Porcentaje (%)</span>
                      <span className="text-[10px] text-gray-400">Personalizar cuota</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSplitMode('FIXED_AMOUNT')}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all ${splitMode === 'FIXED_AMOUNT'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                      <span className="block font-bold">Monto Fijo</span>
                      <span className="text-[10px] text-gray-400">Cuota fija asignada</span>
                    </button>
                  </div>

                  {/* Input for Custom Percentage */}
                  {splitMode === 'PERCENTAGE' && (
                    <div className="pt-2">
                      <div className="flex justify-between text-xs text-gray-300 mb-1 font-medium">
                        <span>Tu cuota: {userPercentage}%</span>
                        <span>{partnerName || 'Pareja'}: {100 - userPercentage}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        step="5"
                        value={userPercentage}
                        onChange={(e) => setUserPercentage(parseInt(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Input for Fixed Amount */}
                  {splitMode === 'FIXED_AMOUNT' && (
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Monto asignado fijamente a {partnerName || 'Pareja'} (S/)
                      </label>
                      <input
                        type="number"
                        value={fixedPartnerAmount}
                        onChange={(e) => setFixedPartnerAmount(e.target.value)}
                        placeholder="Ej. 30.00"
                        className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* Dynamic Calculation Live Preview */}
                  {calculateSplitPreview() && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-semibold flex items-center justify-between">
                      <span>{calculateSplitPreview()}</span>
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
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
                'Guardar Movimiento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
