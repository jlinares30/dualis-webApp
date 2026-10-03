'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Sparkles, Check, RotateCcw } from 'lucide-react';
import { useExchangeRateStore } from '@/lib/stores/useExchangeRateStore';

interface CustomExchangeRateInputProps {
  sourceCurrency: string; // ej. USD
  targetCurrency: string; // ej. PEN
  sourceAmount?: number;   // ej. 100 USD
  onRateChange: (customRate: number | null, computedTargetAmount: number) => void;
  accentColor?: 'emerald' | 'indigo' | 'amber';
}

export function CustomExchangeRateInput({
  sourceCurrency,
  targetCurrency,
  sourceAmount = 0,
  onRateChange,
  accentColor = 'emerald',
}: CustomExchangeRateInputProps) {
  const { convert, getRate } = useExchangeRateStore();

  const isSameCurrency =
    !sourceCurrency ||
    !targetCurrency ||
    sourceCurrency.toUpperCase().trim() === targetCurrency.toUpperCase().trim();

  // Tasa estándar del sistema (1 source = X target)
  const defaultRate = React.useMemo(() => {
    if (isSameCurrency) return 1.0;
    return getRate(sourceCurrency, targetCurrency);
  }, [sourceCurrency, targetCurrency, isSameCurrency, getRate]);

  const [isCustom, setIsCustom] = useState(false);
  const [rateInput, setRateInput] = useState<string>('');

  // Sincronizar input cuando cambian las divisas o se desactiva el modo custom
  useEffect(() => {
    if (!isCustom) {
      setRateInput(defaultRate.toString());
      const computed = isSameCurrency
        ? sourceAmount
        : parseFloat(convert(sourceAmount, sourceCurrency, targetCurrency).toFixed(2));
      onRateChange(null, computed);
    }
  }, [defaultRate, isCustom, sourceAmount, sourceCurrency, targetCurrency, isSameCurrency]);

  if (isSameCurrency) return null;

  const currentRate = isCustom && parseFloat(rateInput) > 0 ? parseFloat(rateInput) : defaultRate;
  const computedAmount = parseFloat((sourceAmount * currentRate).toFixed(2));

  const handleToggle = () => {
    if (isCustom) {
      // Desactivar
      setIsCustom(false);
      setRateInput(defaultRate.toString());
      onRateChange(null, parseFloat((sourceAmount * defaultRate).toFixed(2)));
    } else {
      // Activar
      setIsCustom(true);
      setRateInput(defaultRate.toString());
      onRateChange(defaultRate, parseFloat((sourceAmount * defaultRate).toFixed(2)));
    }
  };

  const handleRateInputChange = (val: string) => {
    setRateInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      const newComputed = parseFloat((sourceAmount * parsed).toFixed(2));
      onRateChange(parsed, newComputed);
    }
  };

  const colorStyles = {
    emerald: {
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      activeText: 'text-emerald-300',
      borderFocus: 'focus:border-emerald-500',
      accentBg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    indigo: {
      badge: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      activeText: 'text-indigo-300',
      borderFocus: 'focus:border-indigo-500',
      accentBg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    amber: {
      badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      activeText: 'text-amber-300',
      borderFocus: 'focus:border-amber-500',
      accentBg: 'bg-amber-500/10 border-amber-500/20',
    },
  }[accentColor];

  return (
    <div className={`p-3 rounded-2xl ${colorStyles.accentBg} border space-y-2 text-xs animate-in fade-in duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-gray-300">
          <ArrowRightLeft className="w-3.5 h-3.5 text-gray-400" />
          <span>Conversión de Divisa</span>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          className="text-[10px] font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 select-none"
        >
          {isCustom ? (
            <span className="flex items-center gap-1 text-amber-400">
              <RotateCcw className="w-3 h-3" /> Usar tasa del sistema
            </span>
          ) : (
            <span className="flex items-center gap-1 hover:underline">
              <Sparkles className="w-3 h-3 text-amber-400" /> Personalizar tasa
            </span>
          )}
        </button>
      </div>

      {isCustom ? (
        <div className="space-y-2 pt-1 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 shrink-0">1 {sourceCurrency} =</span>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              value={rateInput}
              onChange={(e) => handleRateInputChange(e.target.value)}
              placeholder={defaultRate.toString()}
              className={`w-28 px-2.5 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white font-mono font-bold outline-none ${colorStyles.borderFocus}`}
              autoFocus
            />
            <span className="text-[11px] font-semibold text-gray-300">{targetCurrency}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium ml-auto">
              Tasa manual
            </span>
          </div>

          {sourceAmount > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
              <span className="text-gray-400">Total equivalente a debitar/abonar:</span>
              <span className="font-bold font-mono text-white">
                {computedAmount.toLocaleString()} {targetCurrency}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Tasa de cambio del sistema:</span>
            <span className="font-mono font-semibold text-gray-300">
              1 {sourceCurrency} ≈ {defaultRate.toFixed(4)} {targetCurrency}
            </span>
          </div>

          {sourceAmount > 0 && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400">Equivalente estimado:</span>
              <span className={`font-bold font-mono ${colorStyles.activeText}`}>
                {computedAmount.toLocaleString()} {targetCurrency}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
