'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { expireSession, getTokenExpiresAt, SESSION_EXPIRED_EVENT } from '@/lib/session';

export function SessionMonitor() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clearSession = () => {
      useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
      queryClient.clear();
    };
    const checkSession = () => {
      clearTimeout(timer);
      const storedToken = localStorage.getItem('dualis_auth_token');
      if (!storedToken) {
        if (useAuthStore.getState().isAuthenticated) expireSession();
        return;
      }
      const expiresAt = getTokenExpiresAt(storedToken);
      if (expiresAt === null) return;
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        expireSession();
      } else {
        timer = setTimeout(checkSession, Math.min(remaining, 2_147_483_647));
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, clearSession);
    window.addEventListener('focus', checkSession);
    window.addEventListener('pageshow', checkSession);
    window.addEventListener('storage', checkSession);
    document.addEventListener('visibilitychange', checkSession);
    checkSession();
    return () => {
      clearTimeout(timer);
      window.removeEventListener(SESSION_EXPIRED_EVENT, clearSession);
      window.removeEventListener('focus', checkSession);
      window.removeEventListener('pageshow', checkSession);
      window.removeEventListener('storage', checkSession);
      document.removeEventListener('visibilitychange', checkSession);
    };
  }, [queryClient, token]);

  return null;
}
