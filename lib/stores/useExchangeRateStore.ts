import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ExchangeRates {
  [currencyCode: string]: number; // Tasa relativa a USD (USD = 1)
}

// Tasas referenciales predeterminadas frente a USD
const DEFAULT_RATES_VS_USD: ExchangeRates = {
  USD: 1.0,
  PEN: 3.75,
  EUR: 0.92,
  COP: 4150.0,
  MXN: 18.2,
  ARS: 960.0,
  CLP: 940.0,
  BRL: 5.45,
  GBP: 0.78,
  CAD: 1.36,
  CHF: 0.89,
  JPY: 155.0,
};

interface ExchangeRateState {
  rates: ExchangeRates; // Valores relativos a 1 USD
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;

  // Acciones
  setRate: (currency: string, rateVsUsd: number) => void;
  setCustomRates: (newRates: ExchangeRates) => void;
  convert: (amount: number, fromCurrency: string, toCurrency: string) => number;
  fetchLiveRates: () => Promise<void>;
  resetToDefaults: () => void;
}

export const useExchangeRateStore = create<ExchangeRateState>()(
  persist(
    (set, get) => ({
      rates: DEFAULT_RATES_VS_USD,
      lastUpdated: null,
      isLoading: false,
      error: null,

      setRate: (currency: string, rateVsUsd: number) => {
        if (rateVsUsd <= 0) return;
        const code = currency.toUpperCase().trim();
        set((state) => ({
          rates: {
            ...state.rates,
            [code]: rateVsUsd,
          },
          lastUpdated: new Date().toISOString(),
        }));
      },

      setCustomRates: (newRates: ExchangeRates) => {
        set({
          rates: { ...newRates },
          lastUpdated: new Date().toISOString(),
        });
      },

      convert: (amount: number, fromCurrency: string, toCurrency: string): number => {
        if (!amount || amount === 0) return 0;
        const from = (fromCurrency || 'USD').toUpperCase().trim();
        const to = (toCurrency || 'USD').toUpperCase().trim();

        if (from === to) return amount;

        const rates = get().rates;
        const fromRate = rates[from] || 1;
        const toRate = rates[to] || 1;

        // Convertir primero 'from' a USD, luego USD a 'to'
        const amountInUsd = amount / fromRate;
        const result = amountInUsd * toRate;

        return Math.round((result + Number.EPSILON) * 100) / 100;
      },

      fetchLiveRates: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('https://open.er-api.com/v6/latest/USD');
          if (!res.ok) {
            throw new Error(`Error en el servicio de divisas: ${res.statusText}`);
          }
          const data = await res.json();
          if (data && data.rates) {
            set((state) => ({
              rates: {
                ...state.rates,
                ...data.rates,
              },
              lastUpdated: new Date().toISOString(),
              isLoading: false,
              error: null,
            }));
          } else {
            throw new Error('Formato de respuesta de divisas no válido');
          }
        } catch (err: any) {
          console.warn('Fallo al obtener tasas en vivo, manteniendo tasas locales:', err);
          set({
            isLoading: false,
            error: 'No se pudo conectar a la red para actualizar tasas. Se mantienen los valores actuales.',
          });
        }
      },

      resetToDefaults: () => {
        set({
          rates: DEFAULT_RATES_VS_USD,
          lastUpdated: new Date().toISOString(),
          error: null,
        });
      },
    }),
    {
      name: 'dualis-exchange-rates',
    }
  )
);
