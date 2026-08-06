'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  ChevronDown, 
  User, 
  Users, 
  Menu, 
  Check,
  ShieldCheck,
  HeartHandshake,
  LogOut,
  LogIn
} from 'lucide-react';
import { WorkspaceType } from '@/types/finance';
import { cn } from '@/lib/utils';
import { getMe } from '@/lib/auth';
import { useAuthStore } from '@/lib/stores/useAuthStore';

interface HeaderProps {
  currentWorkspace: WorkspaceType;
  onWorkspaceChange: (workspace: WorkspaceType) => void;
  onOpenMobileMenu: () => void;
}

export function Header({ currentWorkspace, onWorkspaceChange, onOpenMobileMenu }: HeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated, logoutUser, setUser } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dualis_auth_token') : null;
    if (token && !user) {
      getMe()
        .then((userData) => setUser(userData))
        .catch(() => {});
    }
  }, [user, setUser]);

  const workspaces = [
    {
      id: 'personal' as WorkspaceType,
      name: 'Espacio Personal',
      description: 'Mis gastos y presupuestos individuales',
      icon: User,
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    {
      id: 'couple' as WorkspaceType,
      name: 'Espacio Pareja',
      description: 'Gastos compartidos con Sofía',
      icon: HeartHandshake,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
  ];

  const activeSpace = workspaces.find((w) => w.id === currentWorkspace) || workspaces[0];
  const ActiveIcon = activeSpace.icon;

  const handleLogout = () => {
    logoutUser();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#090d16]/90 backdrop-blur-md border-b border-gray-800/80 px-4 md:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Context Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Context Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-gray-700 text-sm font-medium text-gray-200 transition-all duration-200 shadow-sm cursor-pointer"
          >
            <div className={cn('p-1 rounded-lg border', activeSpace.badgeColor)}>
              <ActiveIcon className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-xs font-semibold text-white">{activeSpace.name}</span>
              <span className="block text-[10px] text-gray-400">Alternar espacio</span>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', dropdownOpen && 'rotate-180')} />
          </button>

          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDropdownOpen(false)} 
              />
              <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-[#0f172a] border border-gray-800 shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Seleccionar Espacio
                </div>
                <div className="space-y-1">
                  {workspaces.map((space) => {
                    const Icon = space.icon;
                    const isSelected = space.id === currentWorkspace;

                    return (
                      <button
                        key={space.id}
                        onClick={() => {
                          onWorkspaceChange(space.id);
                          setDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-all cursor-pointer',
                          isSelected
                            ? 'bg-indigo-600/15 border border-indigo-500/30 text-white'
                            : 'hover:bg-gray-800/60 text-gray-300'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('p-1.5 rounded-lg border', space.badgeColor)}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-xs text-white">{space.name}</p>
                            <p className="text-[11px] text-gray-400">{space.description}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center gap-3">
        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors cursor-pointer"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#090d16]" />
          </button>

          {notificationsOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setNotificationsOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0f172a] border border-gray-800 shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
                  <span className="text-xs font-bold text-white">Notificaciones</span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">2 Nuevas</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-gray-900/80 border border-gray-800/80">
                    <p className="text-gray-200 font-medium">Sofía agregó un gasto</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Supermercado - $120.000 COP (Split 50/50)</p>
                    <span className="text-[9px] text-gray-500 mt-1 block">Hace 15 min</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-900/80 border border-gray-800/80">
                    <p className="text-gray-200 font-medium">Presupuesto al 85%</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Categoría Alimentación cerca del límite.</p>
                    <span className="text-[9px] text-gray-500 mt-1 block">Hace 2 horas</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Avatar / Auth Trigger */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 pl-2 border-l border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-indigo-500/30">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-semibold text-gray-200">{user.fullName || user.email}</span>
                <span className="block text-[10px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Conectado a API
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </Link>
        )}
      </div>
    </header>
  );
}

