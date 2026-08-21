import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccounts, createAccount, updateAccount, deleteAccount, CreateAccountRequest } from '@/lib/services';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export function useAccounts() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isValidUuid = activeWorkspaceId && /^[0-9a-fA-F-]{36}$/.test(activeWorkspaceId);

  return useQuery({
    queryKey: ['accounts', activeWorkspaceId],
    queryFn: () => getAccounts(activeWorkspaceId!),
    enabled: isAuthenticated && Boolean(isValidUuid),
  });

}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newAccount: CreateAccountRequest) => createAccount(newAccount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAccountRequest> }) => updateAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}

