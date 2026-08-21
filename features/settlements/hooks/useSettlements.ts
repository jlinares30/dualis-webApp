import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDebtBalanceSummary,
  getSettlementsByWorkspace,
  createSettlement,
  completeSettlement,
} from '@/lib/services';
import { CreateSettlementPayload } from '@/types';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export function useDebtBalanceSummary() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const isValidUuid = activeWorkspaceId && /^[0-9a-fA-F-]{36}$/.test(activeWorkspaceId);
  const isCoupleWorkspace = activeWs?.type === 'COUPLE';

  return useQuery({
    queryKey: ['debtBalanceSummary', activeWorkspaceId],
    queryFn: () => getDebtBalanceSummary(activeWorkspaceId!),
    enabled: isAuthenticated && Boolean(isValidUuid) && Boolean(isCoupleWorkspace),
    retry: false,
  });
}

export function useSettlementsHistory() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const isValidUuid = activeWorkspaceId && /^[0-9a-fA-F-]{36}$/.test(activeWorkspaceId);
  const isCoupleWorkspace = activeWs?.type === 'COUPLE';

  return useQuery({
    queryKey: ['settlementsHistory', activeWorkspaceId],
    queryFn: () => getSettlementsByWorkspace(activeWorkspaceId!),
    enabled: isAuthenticated && Boolean(isValidUuid) && Boolean(isCoupleWorkspace),
    retry: false,
  });
}

export function useCreateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSettlementPayload) => createSettlement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtBalanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['settlementsHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}

export function useCompleteSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => completeSettlement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtBalanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['settlementsHistory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}
