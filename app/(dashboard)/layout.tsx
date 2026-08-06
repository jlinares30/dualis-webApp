'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { WorkspaceType } from '@/types/finance';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { activeWorkspaceType, setActiveWorkspace, hasPartner } = useWorkspaceStore();

  const currentWorkspace: WorkspaceType = hasPartner ? activeWorkspaceType : 'personal';

  return (
    <div className="min-h-screen flex bg-[#090d16] text-gray-100 antialiased">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Context Switcher */}
        <Header
          currentWorkspace={currentWorkspace}
          onWorkspaceChange={(type) => setActiveWorkspace(type, type)}
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
