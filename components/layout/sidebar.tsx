'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  PieChart,
  TrendingUp,
  HeartHandshake,
  Users,
  Settings,
  Sparkles,
  X,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const navigationItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Cuentas', href: '/accounts', icon: Wallet },
  { name: 'Transacciones', href: '/transactions', icon: Receipt },
  { name: 'Presupuestos', href: '/budgets', icon: PieChart },
  { name: 'Inversiones', href: '/investments', icon: TrendingUp },
  { name: 'Liquidación', href: '/settlements', icon: HeartHandshake },
  { name: 'Espacios', href: '/workspaces', icon: Users },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { hasPartner, partnerName } = useWorkspaceStore();

  // En Modo Personal (!hasPartner), ocultamos Liquidación y Espacios de la navegación lateral.
  const filteredNavItems = navigationItems.filter((item) => {
    if (!hasPartner && (item.href === '/settlements' || item.href === '/workspaces')) {
      return false;
    }
    return true;
  });

  const navContent = (
    <div className="flex flex-col h-full bg-[#0d1322] border-r border-gray-800/80 text-gray-300 w-64 p-4 transition-all duration-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3 py-4 mb-4 border-b border-gray-800/60">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="p-1 rounded-xl bg-gray-900/90 border border-gray-800 shadow-md flex items-center justify-center shrink-0">
            <Image
              src="/logo-removebg.png"
              alt="Dualis Logo"
              width={34}
              height={34}
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-wide">Dualis</span>
            <span className="block text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">Finanzas Inteligentes</span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Cerrar navegación"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-200'
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Personal Status Badge Footer */}
      <div className="mt-auto p-3.5 rounded-xl bg-gray-900/60 border border-gray-800/60 text-center">
        <span className="block text-xs font-bold text-gray-300">Espacio Personal</span>
        <p className="text-[10px] text-gray-500 mt-0.5">
          Gestión de finanzas individuales activa.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 max-w-xs w-full">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
