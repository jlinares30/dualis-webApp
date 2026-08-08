import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvestments, createInvestment, deleteInvestment, CreateInvestmentRequest, InvestmentDTO } from '@/lib/services/investments-service';

import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';


export function useInvestments() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  return useQuery<InvestmentDTO[]>({
    queryKey: ['investments', activeWorkspaceId],
    queryFn: async () => {
      // El backend Java no expone aún módulo /investments, retornamos mock/empty seguro
      return [];
    },
    enabled: true,
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
