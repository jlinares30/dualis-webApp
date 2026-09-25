import React, { useState, useEffect } from 'react';
import { X, Receipt, Split, Sparkles, Wallet, PieChart, Percent, DollarSign, User, Users } from 'lucide-react';
import { useWorkspaceStore, DefaultSplitRule } from '@/lib/stores/useWorkspaceStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useCreateTransaction, useTransactions, useSplitRules, useCreateSplitRule, useUpdateSplitRule } from '@/hooks';
import { useAccounts, useCreateAccount } from '@/hooks';
import { useCategories, useCreateCategory } from '@/hooks';

interface CreateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'expense' | 'income';
}

export type SplitMode = 'EQUALLY' | 'PERCENTAGE' | 'PROPORTIONAL_INCOME' | 'FIXED_AMOUNT';

export function CreateTransactionModal({ isOpen, onClose, defaultType = 'expense' }: CreateTransactionModalProps) {
  const hasPartner = useWorkspaceStore((state) => state.hasPartner);
  const partnerName = useWorkspaceStore((state) => state.partnerName);
  const defaultSplitRule = useWorkspaceStore((state) => state.defaultSplitRule);
  const defaultUserPercentage = useWorkspaceStore((state) => state.defaultUserPercentage);
  const userMonthlyIncome = useWorkspaceStore((state) => state.userMonthlyIncome || 0);
  const partnerMonthlyIncome = useWorkspaceStore((state) => state.partnerMonthlyIncome || 0);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const { user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState(defaultType);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [isSplit, setIsSplit] = useState(hasPartner);
  const [splitMode, setSplitMode] = useState<DefaultSplitRule>(defaultSplitRule);
  const [userPercentage, setUserPercentage] = useState(defaultUserPercentage);
  const [fixedPartnerAmount, setFixedPartnerAmount] = useState('');

  // Sincronizar reglas y porcentajes cada vez que se abre el modal o cambian en el store
  useEffect(() => {
    if (isOpen) {
      setIsSplit(hasPartner);
      setSplitMode(defaultSplitRule);
      setUserPercentage(defaultUserPercentage);
    }
  }, [isOpen, hasPartner, defaultSplitRule, defaultUserPercentage, userMonthlyIncome, partnerMonthlyIncome]);

  const { mutateAsync: createTx, isPending } = useCreateTransaction();
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspaceType = useWorkspaceStore((state) => state.activeWorkspaceType);

  const personalWs = workspaces.find((w) => w.type === 'INDIVIDUAL' || (w.type as any) === 'personal');
  const coupleWs = workspaces.find((w) => w.type === 'COUPLE' || (w.type as any) === 'couple');
  const isCoupleWorkspace = activeWorkspaceType === 'couple' || activeWorkspaceType === 'COUPLE';

  // Cuentas del workspace activo
  const { data: accountsData } = useAccounts();
  // Cuentas del espacio personal (si estamos en el espacio de pareja)
  const { data: personalAccountsData } = useAccounts(
    isCoupleWorkspace && personalWs?.id ? personalWs.id : undefined
  );

  const { mutateAsync: createAccount } = useCreateAccount();
  const { data: categoriesData } = useCategories(type === 'income' ? 'INCOME' : 'EXPENSE');
  const { mutateAsync: createCategory } = useCreateCategory();
  const { data: txPage } = useTransactions(0, 100);
  const { data: splitRules = [] } = useSplitRules();
  const { mutateAsync: createSplitRuleMut } = useCreateSplitRule();
  const { mutateAsync: updateSplitRuleMut } = useUpdateSplitRule();

  // Lista combinada de cuentas
  const availableAccounts = React.useMemo(() => {
    if (!isCoupleWorkspace) {
      return accountsData || [];
    }

    const personal = (personalAccountsData || []).map((acc) => ({
      ...acc,
      _group: 'Mis Cuentas Personales',
    }));

    const couple = (accountsData || []).map((acc) => ({
      ...acc,
      _group: 'Cuentas Compartidas / Pareja',
    }));

    // Si la misma cuenta estuviera en ambas listas, evitar duplicados por ID
    const seen = new Set<string>();
    const combined: (typeof personal[0])[] = [];

    [...personal, ...couple].forEach((acc) => {
      if (!seen.has(acc.id)) {
        seen.add(acc.id);
        combined.push(acc);
      }
    });

    return combined;
  }, [isCoupleWorkspace, accountsData, personalAccountsData]);

  useEffect(() => {
    if (availableAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(availableAccounts[0].id);
    }
  }, [availableAccounts, selectedAccountId]);

  useEffect(() => {
    if (categoriesData && categoriesData.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categoriesData[0].id);
    }
  }, [categoriesData, selectedCategoryId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      let targetAccountId = selectedAccountId;
      let targetCategoryId = selectedCategoryId;

      // Buscar la cuenta seleccionada en availableAccounts para determinar su workspaceId real
      const selectedAccount = availableAccounts.find((a) => a.id === targetAccountId);

      // Si el gasto no es compartido (100% asumido), se asigna al espacio personal.
      // Si el gasto es compartido (isSplit = true), SIEMPRE se registra en el espacio de pareja (coupleWs)
      // para que ambos miembros puedan verlo en el historial compartido, aun pagando con cuenta personal.
      const effectiveWorkspaceId =
        !isSplit && personalWs?.id
          ? personalWs.id
          : isSplit && coupleWs?.id
            ? coupleWs.id
            : activeWorkspaceId || personalWs?.id;

      // Autocrear cuenta si no existe
      if (!targetAccountId && effectiveWorkspaceId) {
        try {
          const newAcc = await createAccount({
            workspaceId: effectiveWorkspaceId,
            name: 'Cuenta Principal',
            type: 'BANK',
            balance: 0,
            currency: 'PEN',
          });
          targetAccountId = newAcc.id;
        } catch (accErr) {
          console.error('Error al autocrear cuenta para transacción:', accErr);
        }
      }

      // Autocrear categoría si no existe
      if (!targetCategoryId && effectiveWorkspaceId) {
        try {
          const newCat = await createCategory({
            workspaceId: effectiveWorkspaceId,
            name: title || (type === 'income' ? 'Ingreso General' : 'Gasto General'),
            type: type === 'income' ? 'INCOME' : 'EXPENSE',
            categoryNature: 'ESSENTIAL',
          });
          targetCategoryId = newCat.id;
        } catch (catErr) {
          console.error('Error al autocrear categoría para transacción:', catErr);
        }
      }

      if (effectiveWorkspaceId && targetAccountId) {
        // Si el gasto es compartido, sincronizar la regla de división seleccionada en el modal
        let activeSplitRuleId: string | undefined = undefined;
        if (isSplit && coupleWs?.id) {
          const ruleType: 'CUSTOM_PERCENTAGE' | 'EQUAL' = splitMode === 'PERCENTAGE' ? 'CUSTOM_PERCENTAGE' : 'EQUAL';
          const partnerAPct = splitMode === 'PERCENTAGE' ? Number(userPercentage) : 50;
          const partnerBPct = splitMode === 'PERCENTAGE' ? Number((100 - userPercentage).toFixed(2)) : 50;

          try {
            if (splitRules && splitRules.length > 0) {
              const targetRule = splitRules[0];
              await updateSplitRuleMut({
                id: targetRule.id,
                payload: {
                  partnerAPercentage: partnerAPct,
                  partnerBPercentage: partnerBPct,
                  splitType: ruleType,
                  isDefault: true,
                },
              });
              activeSplitRuleId = targetRule.id;
            } else {
              const newRule = await createSplitRuleMut({
                workspaceId: coupleWs.id,
                name: splitMode === 'PERCENTAGE' ? `Porcentual (${partnerAPct}/${partnerBPct})` : 'Equitativo 50/50',
                splitType: ruleType,
                partnerAPercentage: partnerAPct,
                partnerBPercentage: partnerBPct,
                isDefault: true,
              });
              activeSplitRuleId = newRule.id;
            }
          } catch (ruleErr) {
            console.error('Error al sincronizar regla de división:', ruleErr);
          }
        }

        await createTx({
          workspaceId: effectiveWorkspaceId,
          accountId: targetAccountId,
          categoryId: targetCategoryId || undefined,
          amount: parseFloat(amount),
          currency: selectedAccount?.currency || 'PEN',
          type: type === 'income' ? 'INCOME' : 'EXPENSE',
          description: title || (type === 'income' ? 'Ingreso Registrado' : 'Gasto Registrado'),
          transactionDate: new Date().toISOString(),
          splitRuleId: activeSplitRuleId,
        });
      }

      setTitle('');
      setAmount('');
      onClose();
    } catch (err) {
      console.error('Error al crear transacción real:', err);
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
      let myInc = userMonthlyIncome;
      let partnerInc = partnerMonthlyIncome;

      // Si el store local aún no los tiene (ej. en la ventana de la pareja), obtener de la regla guardada en la base de datos
      if (myInc <= 0 && partnerInc <= 0 && splitRules.length > 0) {
        const defaultRule = splitRules.find((r) => r.isDefault || r.splitType === 'PROPORTIONAL') || splitRules[0];
        if (defaultRule && ((defaultRule.partnerAIncome ?? 0) > 0 || (defaultRule.partnerBIncome ?? 0) > 0)) {
          myInc = defaultRule.partnerAIncome ?? 0;
          partnerInc = defaultRule.partnerBIncome ?? 0;
        }
      }

      // Si aún no están configurados los sueldos fijos, calcular a partir de las transacciones de ingreso
      if (myInc <= 0 && partnerInc <= 0 && txPage?.content) {
        const myName = user?.fullName?.split(' ')[0] || 'Tú';
        txPage.content.forEach((tx) => {
          if (tx.type === 'INCOME') {
            if (!tx.paidByUserId || tx.paidByUserId === user?.email || tx.paidByUserName?.includes(myName)) {
              myInc += tx.amount;
            } else {
              partnerInc += tx.amount;
            }
          }
        });
      }

      const totalIncome = myInc + partnerInc;
      let myPct = 50;
      let partnerPct = 50;
      let labelDetail = 'Equitativo 50/50 (Sin ingresos registrados aún)';

      if (totalIncome > 0) {
        myPct = parseFloat(((myInc / totalIncome) * 100).toFixed(1));
        partnerPct = parseFloat((100 - myPct).toFixed(1));
        labelDetail = `Basado en Ingresos (${myInc} vs ${partnerInc}): ${myPct}% / ${partnerPct}%`;
      }

      const myShare = (parsedAmount * myPct) / 100;
      const partnerShare = parsedAmount - myShare;
      return `Tú: S/ ${myShare.toFixed(2)} (${myPct}%) | ${targetName}: S/ ${partnerShare.toFixed(2)} (${partnerPct}%) [${labelDetail}]`;
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
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
              >
                {availableAccounts && availableAccounts.length > 0 ? (
                  isCoupleWorkspace ? (
                    <>
                      {/* Cuentas Personales */}
                      {availableAccounts.some((a) => (a as any)._group === 'Mis Cuentas Personales') && (
                        <optgroup label="👤 Mis Cuentas Personales (Recomendado)">
                          {availableAccounts
                            .filter((a) => (a as any)._group === 'Mis Cuentas Personales')
                            .map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} ({acc.currency || 'PEN'} {acc.balance ?? 0})
                              </option>
                            ))}
                        </optgroup>
                      )}
                      {/* Cuentas Compartidas */}
                      {availableAccounts.some((a) => (a as any)._group === 'Cuentas Compartidas / Pareja') && (
                        <optgroup label="👥 Cuentas Compartidas de Pareja">
                          {availableAccounts
                            .filter((a) => (a as any)._group === 'Cuentas Compartidas / Pareja')
                            .map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} ({acc.currency || 'PEN'} {acc.balance ?? 0})
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </>
                  ) : (
                    availableAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency || 'PEN'} {acc.balance ?? 0})
                      </option>
                    ))
                  )
                ) : (
                  <option value="">Cuenta Principal (Autocrear)</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Categoría</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
            >
              {categoriesData && categoriesData.length > 0 ? (
                categoriesData.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              ) : (
                <option value="">Categoría General (Autocrear)</option>
              )}
            </select>
          </div>

          {/* Split Checkbox & Expanded Advanced Options (Fase 2 - Parejas) */}
          {hasPartner && type === 'expense' && (
            <div className="space-y-3 pt-1 border-t border-gray-800/80">
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-900/80 border border-gray-800 cursor-pointer transition-colors hover:border-gray-700">
                <input
                  type="checkbox"
                  checked={isSplit}
                  onChange={(e) => setIsSplit(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center justify-between flex-1">
                  <span className="text-xs text-gray-200 font-semibold">Dividir este gasto con mi pareja</span>
                  <Split className="w-4 h-4 text-emerald-400" />
                </div>
              </label>

              {/* Banner informativo de destino de la transacción */}
              {!isSplit ? (
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs animate-in fade-in">
                  <User className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold block text-amber-300">Gasto 100% individual</span>
                    <p className="text-[11px] text-amber-200/80 mt-0.5">
                      No se compartirá. Este movimiento se registrará directamente en tu lista de transacciones personales.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs animate-in fade-in">
                  <Users className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold block text-indigo-300">Gasto Compartido en Pareja</span>
                    <p className="text-[11px] text-indigo-200/80 mt-0.5">
                      Visible para ambos en el historial de pareja. Puedes pagarlo con tu cuenta personal o compartida.
                    </p>
                  </div>
                </div>
              )}

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
