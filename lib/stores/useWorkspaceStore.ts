import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkspaceDTO } from '@/types';

export type DefaultSplitRule = 'EQUALLY' | 'PROPORTIONAL_INCOME' | 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface ClosedWorkspaceSnapshot {
  closedAt: string;
  workspaceId: string;
  partnerName: string;
  partnerEmail?: string;
  netBalance: number;
  currency: string;
  debtorEmail?: string | null;
  creditorEmail?: string | null;
  isUserDebtor: boolean;
  isUserCreditor: boolean;
  totalSharedExpenses?: number;
  summaryText?: string;
}

interface WorkspaceState {
  activeWorkspaceId: string | null;
  activeWorkspaceType: 'INDIVIDUAL' | 'COUPLE' | 'personal' | 'couple';
  hasPartner: boolean;
  partnerName: string | null;
  partnerEmail: string | null;
  lastClosedSnapshot: ClosedWorkspaceSnapshot | null;
  defaultSplitRule: DefaultSplitRule;
  defaultUserPercentage: number;
  defaultSettlementAccountId?: string | null;
  userMonthlyIncome?: number;
  partnerMonthlyIncome?: number;
  workspaces: WorkspaceDTO[];
  setActiveWorkspace: (id: string, type?: 'INDIVIDUAL' | 'COUPLE' | 'personal' | 'couple') => void;
  switchWorkspaceType: (type: 'personal' | 'couple' | 'INDIVIDUAL' | 'COUPLE' | string) => void;
  setWorkspaces: (workspaces: WorkspaceDTO[]) => void;
  linkPartner: (name: string, email: string, defaultRule?: DefaultSplitRule) => void;
  unlinkPartner: (snapshot?: ClosedWorkspaceSnapshot) => void;
  clearClosedSnapshot: () => void;
  setDefaultSplitRule: (rule: DefaultSplitRule, percentage?: number) => void;
  setDefaultSettlementAccountId: (accountId: string | null) => void;
  setMonthlyIncomes: (userIncome: number, partnerIncome: number) => void;
  updateWorkspaceCurrency: (workspaceId: string, currency: string) => void;
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
      defaultUserPercentage: 50,
      defaultSettlementAccountId: null,
      userMonthlyIncome: 0,
      partnerMonthlyIncome: 0,
      workspaces: [],
      setActiveWorkspace: (id: string, type?: 'INDIVIDUAL' | 'COUPLE' | 'personal' | 'couple') =>
        set((state: WorkspaceState) => ({
          activeWorkspaceId: id,
          activeWorkspaceType: type || state.activeWorkspaceType,
        })),
      switchWorkspaceType: (type: 'personal' | 'couple' | 'INDIVIDUAL' | 'COUPLE' | string) =>
        set((state: WorkspaceState) => {
          const isCouple = type === 'couple' || type === 'COUPLE';
          const targetType = isCouple ? 'COUPLE' : 'INDIVIDUAL';
          const targetWs = state.workspaces.find(
            (w) => w.type === targetType || (isCouple ? (w.type as any) === 'couple' : (w.type as any) === 'personal')
          );
          return {
            activeWorkspaceType: isCouple ? 'couple' : 'personal',
            activeWorkspaceId: targetWs ? targetWs.id : state.activeWorkspaceId,
          };
        }),
      setWorkspaces: (workspaces: WorkspaceDTO[]) =>
        set((state: WorkspaceState) => {
          const personalWs = workspaces.find((w) => w.type === 'INDIVIDUAL' || (w.type as any) === 'personal');
          const coupleWs = workspaces.find((w) => w.type === 'COUPLE' || (w.type as any) === 'couple');
          
          // Si el servidor ya no devuelve ningún espacio de pareja (porque la pareja lo desvinculó o eliminó):
          const serverHasCouple = Boolean(coupleWs);

          // Si localmente creía tener pareja pero el servidor ya no tiene workspace de pareja:
          if (!serverHasCouple) {
            return {
              workspaces,
              hasPartner: false,
              partnerName: null,
              partnerEmail: null,
              activeWorkspaceId: personalWs ? personalWs.id : (workspaces[0]?.id || null),
              activeWorkspaceType: 'personal',
            };
          }

          // Si el servidor SÍ tiene workspace de pareja:
          // Si no tiene pareja vinculada en local, forzamos al workspace individual
          if (!state.hasPartner || state.activeWorkspaceType === 'personal') {
            return {
              workspaces,
              activeWorkspaceId: personalWs ? personalWs.id : (workspaces[0]?.id || null),
              activeWorkspaceType: 'personal',
            };
          }

          const activeExists = workspaces.some((w) => w.id === state.activeWorkspaceId);
          return {
            workspaces,
            activeWorkspaceId: activeExists ? state.activeWorkspaceId : (workspaces[0]?.id || null),
            activeWorkspaceType: activeExists ? state.activeWorkspaceType : 'personal',
          };
        }),
      updateWorkspaceCurrency: (workspaceId: string, currency: string) =>
        set((state: WorkspaceState) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId ? { ...w, currency } : w
          ),
        })),
      linkPartner: (name: string, email: string, defaultRule: DefaultSplitRule = 'PROPORTIONAL_INCOME') =>
        set((state: WorkspaceState) => {
          const coupleWs = state.workspaces.find((w) => w.type === 'COUPLE' || (w.type as any) === 'couple');
          return {
            hasPartner: true,
            partnerName: name,
            partnerEmail: email,
            defaultSplitRule: defaultRule,
            activeWorkspaceType: coupleWs ? 'couple' : state.activeWorkspaceType,
            activeWorkspaceId: coupleWs ? coupleWs.id : state.activeWorkspaceId,
          };
        }),
      lastClosedSnapshot: null,
      unlinkPartner: (snapshot?: ClosedWorkspaceSnapshot) =>
        set((state: WorkspaceState) => {
          const personalWs = state.workspaces.find(
            (w) => w.type === 'INDIVIDUAL' || (w.type as any) === 'personal'
          );
          const remainingWorkspaces = state.workspaces.filter(
            (w) => w.type === 'INDIVIDUAL' || (w.type as any) === 'personal'
          );
          return {
            hasPartner: false,
            partnerName: null,
            partnerEmail: null,
            lastClosedSnapshot: snapshot || state.lastClosedSnapshot || null,
            activeWorkspaceType: 'personal',
            activeWorkspaceId: personalWs ? personalWs.id : (state.workspaces[0]?.id || null),
            workspaces: remainingWorkspaces.length > 0 ? remainingWorkspaces : state.workspaces,
          };
        }),
      clearClosedSnapshot: () =>
        set(() => ({
          lastClosedSnapshot: null,
        })),
      setDefaultSplitRule: (rule: DefaultSplitRule, percentage?: number) =>
        set((state: WorkspaceState) => ({
          defaultSplitRule: rule,
          defaultUserPercentage: percentage !== undefined ? percentage : state.defaultUserPercentage,
        })),
      setDefaultSettlementAccountId: (accountId: string | null) =>
        set(() => ({
          defaultSettlementAccountId: accountId,
        })),
      setMonthlyIncomes: (userIncome: number, partnerIncome: number) =>
        set(() => {
          const total = userIncome + partnerIncome;
          const calculatedPct = total > 0 ? Math.round((userIncome / total) * 100) : 50;
          return {
            userMonthlyIncome: userIncome,
            partnerMonthlyIncome: partnerIncome,
            defaultUserPercentage: calculatedPct,
          };
        }),
    }),
    {
      name: 'dualis-workspace-storage',
    }
  ) as any
);
