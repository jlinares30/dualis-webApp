'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/auth';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { User, Lock, Mail, ShieldCheck, AlertCircle, ArrowRight, Wallet } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await registerUser({
        email,
        password,
        fullName,
        baseCurrency: 'PEN',
      });


      if (response.token) {
        setAuth(response.token, {
          id: response.id,
          email: response.email,
          fullName: response.name || fullName,
          preferredCurrency: 'PEN',
        });
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090d16] p-4 relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo / Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-2 rounded-2xl bg-gradient-to-tr from-indigo-950/60 via-gray-900 to-emerald-950/50 border border-indigo-500/20 shadow-xl shadow-indigo-500/10 flex items-center justify-center shrink-0">
            <Image
              src="/logo-removebg.png"
              alt="Dualis Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
          </div>
          <div className="text-left">
            <span className="text-2xl font-black tracking-tight text-white block">
              Dualis<span className="text-emerald-400">.</span>
            </span>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest block">
              Financial Suite
            </span>
          </div>
        </div>

        {/* Register Card */}
        <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Crear Cuenta
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Únete a Dualis para sincronizar tus finanzas personales y en pareja.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-400 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. John Wick"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/90 border border-gray-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-gray-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/90 border border-gray-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-gray-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/90 border border-gray-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-gray-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Registrarse
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 text-center pt-4 border-t border-gray-800/60">
            <span className="text-xs text-gray-400">
              ¿Ya tienes una cuenta registrada?{' '}
            </span>
            <Link
              href="/login"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
