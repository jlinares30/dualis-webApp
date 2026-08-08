import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '@/lib/services/transactions-service';
import { CreateTransactionRequest } from '@/types/finance';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export function useTransactions(page = 0, size = 10) {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['transactions', activeWorkspaceId, page, size],
    queryFn: () => getTransactions({ workspaceId: activeWorkspaceId || undefined, page, size }),
    enabled: isAuthenticated,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newTx: CreateTransactionRequest) => createTransaction(newTx),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionRequest> }) => updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}

