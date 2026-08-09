import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getSplitRulesByWorkspace, 
  createSplitRule, 
  updateSplitRule, 
  deleteSplitRule, 
  CreateSplitRulePayload 
} from '@/lib/services/split-rules-service';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export function useSplitRules() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isValidUuid = activeWorkspaceId && /^[0-9a-fA-F-]{36}$/.test(activeWorkspaceId);

  return useQuery({
    queryKey: ['splitRules', activeWorkspaceId],
    queryFn: () => getSplitRulesByWorkspace(activeWorkspaceId!),
    enabled: isAuthenticated && Boolean(isValidUuid),
  });
}

export function useCreateSplitRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSplitRulePayload) => createSplitRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splitRules'] });
    },
  });
}

export function useUpdateSplitRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSplitRulePayload> }) => 
      updateSplitRule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splitRules'] });
    },
  });
}

export function useDeleteSplitRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSplitRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splitRules'] });
    },
  });
}
