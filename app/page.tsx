'use client';

import { useSyncExternalStore } from 'react';
import DashboardLayout from './(dashboard)/layout';
import DashboardPage from './(dashboard)/page';
import { GuestPreview } from '@/features/dashboard/components/guest-preview';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { isTokenExpired } from '@/lib/session';

function subscribeToSession(onChange: () => void) {
  const unsubscribe = useAuthStore.subscribe(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    unsubscribe();
    window.removeEventListener('storage', onChange);
  };
}

const getSessionToken = () => localStorage.getItem('dualis_auth_token');
const getServerToken = () => undefined;

export default function Home() {
  const token = useSyncExternalStore(subscribeToSession, getSessionToken, getServerToken);

  // Never mount private dashboard queries for guests or expired sessions.
  // SessionMonitor handles the expired-token redirect globally.
  if (token === undefined || (token && isTokenExpired(token))) {
    return <main className="min-h-screen grid place-items-center bg-[#090d16] text-gray-400" role="status">Verificando sesión...</main>;
  }

  if (!token) return <GuestPreview />;

  return (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  );
}
