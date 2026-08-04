import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, logout } from '@/lib/auth';
import { WorkspaceDTO } from '@/types/finance';

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
      setAuth: (token, user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('dualis_auth_token', token);
        }
        set({ token, user, isAuthenticated: true });
      },
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logoutUser: () => {
        logout();
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'dualis-auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

interface WorkspaceState {
  activeWorkspaceId: string | null;
  activeWorkspaceType: 'INDIVIDUAL' | 'COUPLE' | 'personal' | 'couple';
  workspaces: WorkspaceDTO[];
  setActiveWorkspace: (id: string, type?: 'INDIVIDUAL' | 'COUPLE' | 'personal' | 'couple') => void;
  setWorkspaces: (workspaces: WorkspaceDTO[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      activeWorkspaceType: 'couple',
      workspaces: [],
      setActiveWorkspace: (id, type) =>
        set((state) => ({
          activeWorkspaceId: id,
          activeWorkspaceType: type || state.activeWorkspaceType,
        })),
      setWorkspaces: (workspaces) =>
        set((state) => {
          const activeExists = workspaces.some((w) => w.id === state.activeWorkspaceId);
          const first = workspaces[0];
          return {
            workspaces,
            activeWorkspaceId: activeExists ? state.activeWorkspaceId : (first?.id || null),
            activeWorkspaceType: activeExists
              ? state.activeWorkspaceType
              : (first?.type === 'COUPLE' ? 'couple' : 'personal'),
          };
        }),
    }),
    {
      name: 'dualis-workspace-storage',
    }
  )
);
