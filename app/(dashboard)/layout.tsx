'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { WorkspaceType } from '@/types/finance';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';

import { useWorkspaces } from '@/hooks/useWorkspaces';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Inicializar consulta de workspaces del usuario para que el store tenga un UUID de workspace válido
  useWorkspaces();

  const { activeWorkspaceType, activeWorkspaceId, switchWorkspaceType, hasPartner, workspaces } = useWorkspaceStore();
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!hasPartner && workspaces.length > 0) {
      const personalWs = workspaces.find((w) => w.type === 'INDIVIDUAL' || (w.type as any) === 'personal');
      if (personalWs && activeWorkspaceId !== personalWs.id) {
        switchWorkspaceType('personal');
      }
    }
  }, [hasPartner, workspaces, activeWorkspaceId, switchWorkspaceType]);

  useEffect(() => {
    if (isMounted) {
      const storedToken = localStorage.getItem('dualis_auth_token');
      if (!isAuthenticated && !token && !storedToken) {
        router.replace('/login');
      }
    }
  }, [isMounted, isAuthenticated, token, router]);

  const currentWorkspace: WorkspaceType = activeWorkspaceType === 'COUPLE' || activeWorkspaceType === 'couple' ? 'couple' : 'personal';

  // Mostrar un loader mientras se verifica el estado de sesión
  if (!isMounted || (!isAuthenticated && !token && (typeof window !== 'undefined' && !localStorage.getItem('dualis_auth_token')))) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#090d16] text-gray-100 antialiased">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Context Switcher */}
        <Header
          currentWorkspace={currentWorkspace}
          onWorkspaceChange={(type) => switchWorkspaceType(type)}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* We clone or pass the workspace context if needed */}
          {React.isValidElement(children)
            ? React.cloneElement(children as React.ReactElement<{ workspace?: WorkspaceType }>, { workspace: currentWorkspace })
            : children}
        </main>
      </div>
    </div>
  );
}
