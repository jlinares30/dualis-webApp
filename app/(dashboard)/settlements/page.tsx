'use client';

import React, { useState } from 'react';
import { 
  HeartHandshake, 
  CheckCircle2, 
  Clock, 
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  AlertCircle,
  TrendingUp,
  Receipt,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useDebtBalanceSummary, useSettlementsHistory, useCreateSettlement } from '@/hooks/useSettlements';
import Link from 'next/link';

export default function SettlementPage() {
  const { user } = useAuthStore();
  const { 
    activeWorkspaceId, 
    partnerName, 
    partnerEmail,
    hasPartner, 
    workspaces 
  } = useWorkspaceStore();

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const isCoupleWorkspace = activeWs?.type === 'COUPLE';

  const { data: balanceSummary, isLoading: isLoadingSummary } = useDebtBalanceSummary();
  const { data: settlementsHistory, isLoading: isLoadingHistory } = useSettlementsHistory();
  const { mutateAsync: createSettlementMut, isPending: isSubmitting } = useCreateSettlement();

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [note, setNote] = useState<string>('Liquidación de gastos compartidos');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentUserEmail = user?.email || '';
  const netBalance = balanceSummary?.netBalance || 0;
  const debtorEmail = balanceSummary?.debtorEmail;
  const creditorEmail = balanceSummary?.creditorEmail;

  // Determine user relationship to debt
  const isUserDebtor = debtorEmail && currentUserEmail.toLowerCase() === debtorEmail.toLowerCase();
  const isUserCreditor = creditorEmail && currentUserEmail.toLowerCase() === creditorEmail.toLowerCase();

  const otherPartnerName = partnerName || (partnerEmail ? partnerEmail.split('@')[0] : 'tu pareja');

  const openSettleModal = () => {
    setCustomAmount(netBalance > 0 ? netBalance.toString() : '0');
    setErrorMsg(null);
    setSuccessMsg(null);
    setModalOpen(true);
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amountNum = parseFloat(customAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Ingresa un monto válido mayor a 0');
      return;
    }

    if (!activeWorkspaceId) {
      setErrorMsg('No hay un espacio de pareja seleccionado');
      return;
    }

    // Determine payer and recipient
    let payerEmail = currentUserEmail;
    let recipientEmail = partnerEmail || '';

    if (isUserCreditor && debtorEmail) {
      payerEmail = debtorEmail;
      recipientEmail = currentUserEmail;
    } else if (isUserDebtor && creditorEmail) {
      payerEmail = currentUserEmail;
      recipientEmail = creditorEmail;
    }

    try {
      await createSettlementMut({
        workspaceId: activeWorkspaceId,
        payerEmail: payerEmail,
        recipientEmail: recipientEmail,
        amount: amountNum,
        currency: activeWs?.currency || 'PEN',
        note: note.trim() || 'Liquidación de gastos compartidos',
      });

      setSuccessMsg('¡Pago de liquidación registrado con éxito!');
      setTimeout(() => {
        setModalOpen(false);
        setSuccessMsg(null);
      }, 1800);
    } catch (err: any) {
      console.error('Error al registrar liquidación:', err);
      setErrorMsg(err?.message || 'Error al conectar con el servidor');
    }
  };

  if (!isCoupleWorkspace) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
        <div className="pb-4 border-b border-gray-800/60 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Liquidación en Pareja
            </h1>
            <p className="text-xs md:text-sm text-gray-400">
              Gestión de cuentas compartidas
            </p>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-gray-900/80 border border-gray-800 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Requiere Espacio Compartido de Pareja</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Para ver el balance en tiempo real y saldar cuentas con tu pareja, vincula a tu pareja desde la configuración.
          </p>
          <div className="pt-2">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer shadow-lg"
            >
              <Sparkles className="w-4 h-4" /> Ir a Configuración & Vincular Pareja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      {/* Header */}
      <div className="pb-4 border-b border-gray-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
              <HeartHandshake className="w-3 h-3" /> Liquidación en Pareja
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Saldar Cuentas
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Calculador automático de balance de gastos compartidos con <strong className="text-white">{otherPartnerName}</strong>.
          </p>
        </div>
      </div>

      {/* Main Settlement Status Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/50 via-gray-900 to-emerald-950/40 border border-emerald-500/30 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${netBalance > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Balance Actual Acumulado
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                {isLoadingSummary ? (
                  <span className="text-gray-500 animate-pulse">Cargando...</span>
                ) : (
                  formatCurrency(netBalance, activeWs?.currency || 'PEN')
                )}
              </h2>

              {!isLoadingSummary && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  netBalance === 0 
                    ? 'bg-gray-800 text-gray-300 border-gray-700' 
                    : isUserCreditor 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  {netBalance === 0 ? 'Cuentas al día' : isUserCreditor ? 'A favor tuyo' : 'Por pagar'}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-300">
              {netBalance === 0 ? (
                <span>No hay deudas pendientes entre ustedes. ¡Todo está en orden!</span>
              ) : isUserCreditor ? (
                <span><strong className="text-white">{otherPartnerName}</strong> debe transferirte este monto para saldar las cuentas.</span>
              ) : (
                <span>Debes transferir este monto a <strong className="text-white">{otherPartnerName}</strong> para dejar las cuentas en <strong>S/ 0.00</strong>.</span>
              )}
            </p>
          </div>

          {/* Action button */}
          <div className="w-full md:w-auto">
            <button
              onClick={openSettleModal}
              className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-gray-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Registrar Pago / Saldar</span>
            </button>
          </div>
        </div>

        {/* Breakdown Stats */}
        {balanceSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-800/60">
            <div className="p-3 rounded-2xl bg-gray-950/40 border border-gray-800/50">
              <span className="block text-[10px] text-gray-400 font-semibold uppercase">Total Gastos Compartidos</span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                {formatCurrency(balanceSummary.totalSharedExpenses, activeWs?.currency || 'PEN')}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-gray-950/40 border border-gray-800/50">
              <span className="block text-[10px] text-gray-400 font-semibold uppercase">Tus Aportes</span>
              <span className="text-sm font-bold text-indigo-400 mt-0.5 block">
                {formatCurrency(balanceSummary.partnerAPaidTotal, activeWs?.currency || 'PEN')}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-gray-950/40 border border-gray-800/50 col-span-2 sm:col-span-1">
              <span className="block text-[10px] text-gray-400 font-semibold uppercase">Aportes de {otherPartnerName}</span>
              <span className="text-sm font-bold text-purple-400 mt-0.5 block">
                {formatCurrency(balanceSummary.partnerBPaidTotal, activeWs?.currency || 'PEN')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* History of Settlements */}
      <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Historial de Liquidaciones</h3>
              <p className="text-xs text-gray-400">Pagos y cierres de cuenta registrados en el servidor</p>
            </div>
          </div>
        </div>

        {isLoadingHistory ? (
          <div className="py-8 text-center text-xs text-gray-500">Cargando historial de liquidaciones...</div>
        ) : !settlementsHistory || settlementsHistory.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Receipt className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-xs text-gray-400 font-medium">Aún no hay pagos de liquidación registrados en este espacio.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {settlementsHistory.map((item) => {
              const isPayerMe = item.payerEmail.toLowerCase() === currentUserEmail.toLowerCase();
              const payerLabel = isPayerMe ? 'Tú' : otherPartnerName;
              const recipientLabel = isPayerMe ? otherPartnerName : 'Tú';

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gray-900/60 border border-gray-800/60 gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {payerLabel} ➔ {recipientLabel}
                        </span>
                        <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-md font-mono">
                          {item.settledAt ? new Date(item.settledAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Completado'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{item.note || 'Liquidación de cuentas'}</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="font-extrabold text-base text-emerald-400 block">
                      + {formatCurrency(item.amount, item.currency || activeWs?.currency || 'PEN')}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium uppercase">{item.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Registrar Pago de Liquidación */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Registrar Pago de Liquidación</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSettleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Monto a Saldar ({activeWs?.currency || 'PEN'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm font-bold text-white outline-none focus:border-emerald-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nota o Referencia
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-emerald-500"
                  placeholder="Ej. Transferencia Yape / Zelle del mes"
                  maxLength={100}
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Confirmar Pago
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
