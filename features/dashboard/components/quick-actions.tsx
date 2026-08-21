'use client';

import React, { useState } from 'react';
import { PlusCircle, Split } from 'lucide-react';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { CreateTransactionModal } from '@/features/transactions/components/create-transaction-modal';

interface QuickActionsProps {
  workspace?: 'personal' | 'couple';
}

export function QuickActions({ workspace = 'personal' }: QuickActionsProps) {
  const { hasPartner } = useWorkspaceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isCouple = hasPartner && workspace === 'couple';

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {/* Agregar Gasto Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Agregar Gasto</span>
        </button>

        {/* Crear Transacción Dividida Button (Solo visible en modo pareja cuando está activado) */}
        {isCouple && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-800/90 hover:bg-gray-700/90 border border-gray-700/80 text-emerald-400 font-medium text-sm transition-all duration-200 active:scale-95 shadow-md cursor-pointer"
          >
            <Split className="w-4 h-4" />
            <span>Dividir Gasto (Split)</span>
          </button>
        )}
      </div>

      {/* Real Transaction Modal */}
      <CreateTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType="expense"
      />
    </>
  );
}

