import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardSummary } from '@/lib/services/dashboard-service';
import { getTransactions, createTransaction, deleteTransaction } from '@/lib/services/transactions-service';
import { getUserWorkspaces } from '@/lib/services/workspaces-service';
import { CreateTransactionRequest } from '@/types/finance';
import { useAuthStore, useWorkspaceStore } from '@/lib/stores/useStore';

// Hook para el Resumen del Dashboard
export function useDashboardSummary() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['dashboardSummary', activeWorkspaceId],
    queryFn: () => getDashboardSummary(activeWorkspaceId || undefined),
    enabled: isAuthenticated,
  });
}

// Hook para la Lista de Transacciones Paginada
export function useTransactions(page = 0, size = 10) {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['transactions', activeWorkspaceId, page, size],
    queryFn: () => getTransactions({ workspaceId: activeWorkspaceId || undefined, page, size }),
    enabled: isAuthenticated,
  });
}

// Hook para Crear Transacción con revalidación automática
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

// Hook para Eliminar Transacción
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

// Hook para obtener y actualizar Workspaces
export function useWorkspaces() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);

  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const data = await getUserWorkspaces();
      setWorkspaces(data);
      return data;
    },
    enabled: isAuthenticated,
  });
}
