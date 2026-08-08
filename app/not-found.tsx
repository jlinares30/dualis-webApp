import React from 'react';
import Link from 'next/link';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Glow & Icon */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 mx-auto rounded-3xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-2xl">
            <Compass className="w-10 h-10 animate-spin-slow" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-block">
            Error 404
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Página No Encontrada
          </h1>
          <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
            La ruta a la que intentas acceder no existe, se ha movido o no tienes permisos para visualizarla.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Home className="w-4 h-4" /> Ir al Inicio
          </Link>
          <Link
            href="/transactions"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Ver Transacciones
          </Link>
        </div>
      </div>
    </div>
  );
}
