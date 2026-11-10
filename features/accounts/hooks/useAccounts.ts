import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SHARED_DATA_REFETCH_MS } from '@/lib/query-config';
import { getAccounts, createAccount, updateAccount, deleteAccount, CreateAccountRequest } from '@/lib/services';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

import { DEMO_ACCOUNTS } from '@/lib/mock-demo-data';

export function useAccounts(customWorkspaceId?: string) {
  const storeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const activeWorkspaceId = customWorkspaceId || storeWorkspaceId;
  const hasPartner = useWorkspaceStore((state) => state.hasPartner);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isValidUuid = activeWorkspaceId && /^[0-9a-fA-F-]{36}$/.test(activeWorkspaceId);

  return useQuery({
    queryKey: ['accounts', activeWorkspaceId, isAuthenticated],
    queryFn: () => {
      if (!isAuthenticated) {
        return DEMO_ACCOUNTS;
      }
      return getAccounts(activeWorkspaceId!);
    },
    enabled: (!isAuthenticated) || Boolean(isValidUuid),
    refetchInterval: isAuthenticated && hasPartner ? SHARED_DATA_REFETCH_MS : false,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
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

