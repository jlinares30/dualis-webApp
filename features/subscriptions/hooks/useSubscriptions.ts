import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSubscriptions, createSubscription, toggleSubPaidStatus, deleteSubscription } from '@/lib/services';
import { CreateSubscriptionRequest } from '@/types';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export function useSubscriptions() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['subscriptions', activeWorkspaceId],
    queryFn: () => getSubscriptions(activeWorkspaceId!),
    enabled: isAuthenticated && Boolean(activeWorkspaceId),
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
