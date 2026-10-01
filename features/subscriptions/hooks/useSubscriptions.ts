import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSubscriptions, createSubscription, toggleSubPaidStatus, deleteSubscription } from '@/lib/services';
import { CreateSubscriptionRequest } from '@/types';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export function useSubscriptions() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const hasPartner = useWorkspaceStore((state) => state.hasPartner);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['subscriptions', activeWorkspaceId],
    queryFn: () => getSubscriptions(activeWorkspaceId!),
    enabled: isAuthenticated && Boolean(activeWorkspaceId),
    refetchInterval: hasPartner ? 5000 : false,
    refetchIntervalInBackground: false,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateSubscriptionRequest) => createSubscription(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useToggleSubscriptionPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subId: string) => toggleSubPaidStatus(subId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subId: string) => deleteSubscription(subId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useSalaryDistributionConfig() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['salaryDistributionConfig', activeWorkspaceId, user?.email],
    queryFn: async () => {
      const { getSalaryDistributionConfig } = await import('../services/subscriptions-service');
      return getSalaryDistributionConfig(activeWorkspaceId!, user?.email);
    },
    enabled: isAuthenticated && Boolean(activeWorkspaceId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveSalaryDistributionConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { saveSalaryDistributionConfig } = await import('../services/subscriptions-service');
      return saveSalaryDistributionConfig(payload);
    },
    onSuccess: (savedConfig, variables) => {
      queryClient.setQueryData(
        ['salaryDistributionConfig', variables.workspaceId, variables.userEmail],
        savedConfig
      );
      queryClient.invalidateQueries({ queryKey: ['salaryDistributionConfig'] });
    },
  });
}
