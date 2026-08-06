'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/lib/auth';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { Sparkles, Lock, Mail, ShieldCheck, AlertCircle, ArrowRight, Wallet } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginUser({
        email,
        password,
      });

      if (response.token) {
        setAuth(response.token, {
          id: response.id,
          email: response.email,
          fullName: response.name,
          preferredCurrency: 'COP',
        });
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Por favor verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090d16] p-4 relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo / Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 text-white shadow-xl shadow-indigo-500/20">
            <Wallet className="w-8 h-8" />
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

        {/* Login Card */}
        <div className="rounded-3xl bg-[#0f172a]/90 border border-gray-800/80 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Ingresa a tu cuenta para acceder a tu panel financiero.
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/90 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-gray-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-300">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/90 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-gray-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 text-center pt-4 border-t border-gray-800/60">
            <span className="text-xs text-gray-400">
              ¿No tienes una cuenta aún?{' '}
            </span>
            <Link
              href="/register"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Regístrate gratis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
