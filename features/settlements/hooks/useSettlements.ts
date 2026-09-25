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

export function useDebtBalanceSummary(customWorkspaceId?: string) {
  const storeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Si se pasa un customWorkspaceId se usa, de lo contrario se busca el workspace de pareja si está en modo couple
  const coupleWs = workspaces.find((w) => w.type === 'COUPLE' || (w.type as any) === 'couple');
  const targetWorkspaceId = customWorkspaceId || (coupleWs ? coupleWs.id : storeWorkspaceId);

  const targetWs = workspaces.find((w) => w.id === targetWorkspaceId);
  const isValidUuid = targetWorkspaceId && /^[0-9a-fA-F-]{36}$/.test(targetWorkspaceId);
  const isCoupleWorkspace = targetWs?.type === 'COUPLE';

  return useQuery({
    queryKey: ['debtBalanceSummary', targetWorkspaceId],
    queryFn: () => getDebtBalanceSummary(targetWorkspaceId!),
    enabled: isAuthenticated && Boolean(isValidUuid) && Boolean(isCoupleWorkspace),
    retry: false,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}

export function useSettlementsHistory(customWorkspaceId?: string) {
  const storeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const coupleWs = workspaces.find((w) => w.type === 'COUPLE' || (w.type as any) === 'couple');
  const targetWorkspaceId = customWorkspaceId || (coupleWs ? coupleWs.id : storeWorkspaceId);

  const targetWs = workspaces.find((w) => w.id === targetWorkspaceId);
  const isValidUuid = targetWorkspaceId && /^[0-9a-fA-F-]{36}$/.test(targetWorkspaceId);
  const isCoupleWorkspace = targetWs?.type === 'COUPLE';

  return useQuery({
    queryKey: ['settlementsHistory', targetWorkspaceId],
    queryFn: () => getSettlementsByWorkspace(targetWorkspaceId!),
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
