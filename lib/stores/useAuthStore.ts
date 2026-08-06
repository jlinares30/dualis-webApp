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

const IS_DEV = process.env.NODE_ENV === 'development';

const DEV_MOCK_USER: UserProfile = {
  id: 'dev-user-id',
  email: 'jorge.dev@dualis.app',
  fullName: 'Jorge Linares',
  preferredCurrency: 'PEN',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: IS_DEV ? 'dev-mock-jwt-token-dualis' : null,
      user: IS_DEV ? DEV_MOCK_USER : null,
      isAuthenticated: true,
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
