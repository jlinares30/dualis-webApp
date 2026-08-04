import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkspaceDTO } from '@/types/finance';

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
