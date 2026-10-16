import Link from 'next/link';
import { ArrowRight, Eye, Wallet, Target, Users } from 'lucide-react';

// Public preview: deliberately independent of auth/workspace stores and API hooks.
const demoSummary = [
  { label: 'Ingresos del mes', value: 'S/ 5,000.00', color: 'text-emerald-400' },
  { label: 'Gastos del mes', value: 'S/ 2,800.00', color: 'text-rose-400' },
  { label: 'Disponible', value: 'S/ 2,200.00', color: 'text-indigo-400' },
];

export function GuestPreview() {
  return (
    <main className="min-h-screen bg-[#090d16] text-gray-100">
      <div className="mx-auto max-w-6xl px-6 py-8 md:py-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-2xl font-bold">Dualis<span className="text-emerald-400">.</span></span>
          <Link href="/login" className="rounded-xl border border-gray-700 px-5 py-2.5 text-sm font-medium hover:bg-gray-800">Iniciar sesión</Link>
        </header>

        <section className="py-12 md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-400"><Eye size={16} /> Vista de invitado</span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">Tus finanzas claras, en solitario o en pareja.</h1>
          <p className="mt-5 max-w-2xl text-lg text-gray-400">Organiza tus cuentas, controla tus gastos y alcanza tus metas con Dualis. Explora este resumen de ejemplo sin iniciar sesión.</p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold hover:bg-indigo-500">Crear mi cuenta <ArrowRight size={18} /></Link>
        </section>

        <section aria-labelledby="preview-title" className="rounded-2xl border border-gray-800 bg-[#0f172a] p-6 md:p-8">
          <h2 id="preview-title" className="text-xl font-semibold">Resumen financiero de ejemplo</h2>
          <p className="mt-2 text-sm text-amber-400">Datos ficticios de demostración. No representan cuentas ni movimientos reales.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {demoSummary.map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-800 bg-[#0B0F19] p-5">
                <p className="text-sm text-gray-400">{item.label}</p>
                <p className={`mt-3 text-2xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-6 text-sm text-gray-400 md:grid-cols-3">
            <div><Wallet className="mb-3 text-indigo-400" /><h3 className="mb-2 font-semibold text-gray-100">Cuentas y gastos</h3>Conoce cuánto tienes y en qué gastas.</div>
            <div><Target className="mb-3 text-emerald-400" /><h3 className="mb-2 font-semibold text-gray-100">Metas de ahorro</h3>Avanza hacia tus objetivos financieros.</div>
            <div><Users className="mb-3 text-indigo-400" /><h3 className="mb-2 font-semibold text-gray-100">Finanzas compartidas</h3>Organiza los gastos en pareja sin perder tu privacidad.</div>
          </div>
        </section>
      </div>
    </main>
  );
}
