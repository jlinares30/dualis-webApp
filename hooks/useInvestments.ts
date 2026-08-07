import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvestments, createInvestment, deleteInvestment, CreateInvestmentRequest } from '@/lib/services/investments-service';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export function useInvestments() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['investments', activeWorkspaceId],
    queryFn: () => getInvestments(activeWorkspaceId || undefined),
    enabled: isAuthenticated,
  });
}

export function useCreateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newInv: CreateInvestmentRequest) => createInvestment(newInv),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}

export function useDeleteInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInvestment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}
