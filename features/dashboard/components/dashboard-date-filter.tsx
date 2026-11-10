'use client';

import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type DateFilterOption = 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'ALL_TIME';

interface DashboardDateFilterProps {
  selectedPeriod: DateFilterOption;
  onPeriodChange: (period: DateFilterOption) => void;
}

export function DashboardDateFilter({ selectedPeriod, onPeriodChange }: DashboardDateFilterProps) {
  const now = new Date();
  const monthLabel = (d: Date) => {
    const text = d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  const options: { id: DateFilterOption; label: string }[] = [
    { id: 'THIS_MONTH', label: `Este Mes (${monthLabel(now)})` },
    { id: 'LAST_MONTH', label: `Mes Anterior (${monthLabel(new Date(now.getFullYear(), now.getMonth() - 1, 1))})` },
    { id: 'LAST_3_MONTHS', label: 'Últimos 3 Meses' },
    { id: 'ALL_TIME', label: 'Todo el Historial' },
  ];

  const currentLabel = options.find((o) => o.id === selectedPeriod)?.label || 'Este Mes';

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium hidden sm:inline">Periodo:</span>
        <select
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value as DateFilterOption)}
          className="px-3 py-1.5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs font-semibold text-gray-200 outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id} className="bg-[#0f172a] text-white">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
