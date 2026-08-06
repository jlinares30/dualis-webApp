import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, logout } from '@/lib/auth';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserProfile) => void;
  setUser: (user: UserProfile | null) => void;
  logoutUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token: string, user: UserProfile) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('dualis_auth_token', token);
        }
        set({ token, user, isAuthenticated: true });
      },
      setUser: (user: UserProfile | null) => set({ user, isAuthenticated: !!user }),
      logoutUser: () => {
        logout();
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'dualis-auth-storage',
      partialize: (state: AuthState) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  ) as any
);
