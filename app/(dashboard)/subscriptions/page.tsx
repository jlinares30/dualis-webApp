'use client';

import React, { useState } from 'react';
import { Calendar, Plus, CheckCircle2, Clock, Trash2, Home, Zap, Tv, Shield, BookOpen, Layers } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSubscriptions, useCreateSubscription, useToggleSubscriptionPaid, useDeleteSubscription } from '@/features/subscriptions';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export default function SubscriptionsPage() {
  const { activeWorkspaceId, workspaces } = useWorkspaceStore();
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const currency = activeWs?.currency || 'PEN';

  const { data: subs = [], isLoading } = useSubscriptions();
  const { mutateAsync: createSubMut, isPending: isCreating } = useCreateSubscription();
  const { mutateAsync: togglePaidMut } = useToggleSubscriptionPaid();
  const { mutateAsync: deleteSubMut } = useDeleteSubscription();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [category, setCategory] = useState<'HOUSING' | 'UTILITIES' | 'SUBSCRIPTION' | 'HEALTH' | 'EDUCATION' | 'OTHER'>('SUBSCRIPTION');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !activeWorkspaceId) return;

    try {
      await createSubMut({
        workspaceId: activeWorkspaceId,
        name,
        amount: parseFloat(amount),
        dueDay: parseInt(dueDay, 10),
        category,
        currency,
      });
      setModalOpen(false);
      setName('');
      setAmount('');
      setDueDay('5');
    } catch (err) {
      console.error('Error al crear suscripción:', err);
    }
  };

  const getSubIcon = (cat?: string) => {
    switch (cat) {
      case 'HOUSING': return Home;
      case 'UTILITIES': return Zap;
      case 'SUBSCRIPTION': return Tv;
      case 'HEALTH': return Shield;
      case 'EDUCATION': return BookOpen;
      default: return Layers;
    }
  };

  const totalMonthlyCommitments = subs.reduce((acc, item) => acc + item.amount, 0);
  const currentDay = new Date().getDate();

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Compromisos Fijos
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Suscripciones y Pagos Fijos Recurrentes
          </h1>
          <p className="text-xs md:text-sm text-gray-400">
            Organiza tus gastos fijos del mes, mantén el control de vencimientos y nunca pagues mora.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gray-900 border border-gray-800 text-right">
            <span className="text-[10px] text-gray-400 font-medium block uppercase tracking-wider">Total Fijo Mensual</span>
            <span className="text-base font-extrabold text-amber-400">
              {formatCurrency(totalMonthlyCommitments, currency)}
            </span>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Agregar Pago Fijo
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="h-64 rounded-2xl bg-gray-900/60 animate-pulse border border-gray-800/50 flex items-center justify-center text-xs text-gray-500">
          Cargando facturas y suscripciones...
        </div>
      ) : subs.length === 0 ? (
        <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-white">Sin suscripciones o servicios registrados</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Registra tus compromisos mensuales (Alquiler, Luz, Agua, Internet, Streaming, Gimnasio) para recibir alertas antes de la fecha de cobro.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" /> Agregar Mi Primer Pago Fijo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subs.map((sub) => {
            const Icon = getSubIcon(sub.category);
            const isPastDue = !sub.isPaidThisMonth && sub.dueDay < currentDay;

            return (
              <div
                key={sub.id}
                className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 p-6 shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white truncate max-w-[160px]">{sub.name}</h3>
                        <span className="text-[10px] text-gray-400 font-medium">
                          Vence el día {sub.dueDay} de cada mes
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteSubMut(sub.id)}
                      className="p-1.5 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Eliminar pago fijo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800/60 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Monto Mensual</span>
                    <span className="text-lg font-extrabold text-white">
                      {formatCurrency(sub.amount, sub.currency || currency)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-800/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => togglePaidMut(sub.id)}
                    className={`w-full py-2 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      sub.isPaidThisMonth
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-amber-600/20 text-amber-300 border-amber-500/30 hover:bg-amber-600/30'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {sub.isPaidThisMonth ? 'Pagado este Mes' : 'Marcar como Pagado'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear Pago Fijo */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0f172a] border border-gray-800 p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-white">Nuevo Pago Fijo Recurrente</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Concepto o Servicio</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Alquiler de Departamento, Netflix, Luz"
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Monto Mensual (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1500.00"
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Día de Cobro (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Categoría del Servicio</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="HOUSING">🏠 Alquiler / Hipoteca</option>
                  <option value="UTILITIES">⚡ Servicios (Luz, Agua, Internet)</option>
                  <option value="SUBSCRIPTION">📺 Streaming / Suscripciones</option>
                  <option value="HEALTH">🛡️ Seguro de Salud / Médico</option>
                  <option value="EDUCATION">📚 Educación / Cursos</option>
                  <option value="OTHER">📦 Otro Compromiso</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? 'Guardando...' : 'Registrar Pago Fijo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
