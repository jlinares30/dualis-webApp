'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { expireSession, getTokenExpiresAt, getTokenLifetimeMs, SESSION_EXPIRED_EVENT } from '@/lib/session';
import { refreshSessionToken } from '@/lib/auth';

// Renew the token this long before it expires, as long as the app is open and visible.
const REFRESH_BEFORE_EXPIRY_MS = 10 * 60 * 1000;

export function SessionMonitor() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let refreshing = false;
    const tryRefresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const newToken = await refreshSessionToken();
        const { user, setAuth } = useAuthStore.getState();
        if (newToken && user) {
          setAuth(newToken, user);
        }
      } catch {
        // apiFetch already expires the session on 401; otherwise keep the current token until it expires
      } finally {
        refreshing = false;
      }
    };
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
        return;
      }
      // Never use a window longer than half the token lifetime, so a fresh token is not renewed again.
      const lifetime = getTokenLifetimeMs(storedToken);
      const refreshWindow = lifetime ? Math.min(REFRESH_BEFORE_EXPIRY_MS, lifetime / 2) : REFRESH_BEFORE_EXPIRY_MS;
      if (remaining <= refreshWindow && document.visibilityState === 'visible') {
        // The token change re-runs this effect, which schedules the next check.
        void tryRefresh();
      }
      const untilRefresh = remaining - refreshWindow;
      const next = untilRefresh > 0 ? untilRefresh : remaining;
      timer = setTimeout(checkSession, Math.min(next, 2_147_483_647));
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
