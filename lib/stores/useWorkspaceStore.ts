import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkspaceDTO } from '@/types/finance';

export type DefaultSplitRule = 'EQUALLY' | 'PROPORTIONAL_INCOME' | 'PERCENTAGE' | 'FIXED_AMOUNT';

interface WorkspaceState {
  activeWorkspaceId: string | null;
  activeWorkspaceType: 'INDIVIDUAL' | 'COUPLE' | 'personal' | 'couple';
  hasPartner: boolean;
  partnerName: string | null;
  partnerEmail: string | null;
  defaultSplitRule: DefaultSplitRule;
  defaultUserPercentage: number;
  workspaces: WorkspaceDTO[];
  setActiveWorkspace: (id: string, type?: 'INDIVIDUAL' | 'COUPLE' | 'personal' | 'couple') => void;
  setWorkspaces: (workspaces: WorkspaceDTO[]) => void;
  linkPartner: (name: string, email: string, defaultRule?: DefaultSplitRule) => void;
  unlinkPartner: () => void;
  setDefaultSplitRule: (rule: DefaultSplitRule, percentage?: number) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspaceId: null,
      activeWorkspaceType: 'personal', // Por defecto 100% individual
      hasPartner: false, // Por defecto SIN pareja vinculada
      partnerName: null,
      partnerEmail: null,
      defaultSplitRule: 'PROPORTIONAL_INCOME', // Por defecto en proporción a ingresos cuando se vinculen
      defaultUserPercentage: 60,
      workspaces: [],
      setActiveWorkspace: (id: string, type?: 'INDIVIDUAL' | 'COUPLE' | 'personal' | 'couple') =>
        set((state: WorkspaceState) => ({
          activeWorkspaceId: id,
          activeWorkspaceType: type || state.activeWorkspaceType,
        })),
      setWorkspaces: (workspaces: WorkspaceDTO[]) =>
        set((state: WorkspaceState) => {
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
      linkPartner: (name: string, email: string, defaultRule: DefaultSplitRule = 'PROPORTIONAL_INCOME') =>
        set({
          hasPartner: true,
          partnerName: name,
          partnerEmail: email,
          defaultSplitRule: defaultRule,
        }),
      unlinkPartner: () =>
        set({
          hasPartner: false,
          partnerName: null,
          partnerEmail: null,
          activeWorkspaceType: 'personal',
        }),
      setDefaultSplitRule: (rule: DefaultSplitRule, percentage?: number) =>
        set((state: WorkspaceState) => ({
          defaultSplitRule: rule,
          defaultUserPercentage: percentage !== undefined ? percentage : state.defaultUserPercentage,
        })),
    }),
    {
      name: 'dualis-workspace-storage',
    }
  ) as any
);
