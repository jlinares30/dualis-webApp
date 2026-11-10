import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SHARED_DATA_REFETCH_MS } from '@/lib/query-config';
import { getSubscriptions, createSubscription, toggleSubPaidStatus, deleteSubscription } from '@/lib/services';
import { CreateSubscriptionRequest } from '@/types';
import {
  paySubscription,
  undoSubscriptionPayment,
  getSubscriptionPayments,
} from '../services/subscriptions-service';
import { PaySubscriptionPayload, SubscriptionPeriod } from '../types/subscriptions';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

import { DEMO_SUBSCRIPTIONS, DEMO_SALARY_CONFIG } from '@/lib/mock-demo-data';

/**
 * Subscriptions with their paid status for the given month.
 * Without a period, the backend uses the current month.
 */
const isUuid = (id?: string | null): boolean => Boolean(id && /^[0-9a-fA-F-]{36}$/.test(id));

export function useSubscriptions(period?: SubscriptionPeriod) {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const hasPartner = useWorkspaceStore((state) => state.hasPartner);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['subscriptions', activeWorkspaceId, isAuthenticated, period?.year ?? null, period?.month ?? null],
    queryFn: () => {
      if (!isAuthenticated) {
        return DEMO_SUBSCRIPTIONS;
      }
      return getSubscriptions(activeWorkspaceId!, period);
    },
    // Wait for a real workspace id (the demo id is used before the user's workspaces load)
    enabled: (!isAuthenticated) || isUuid(activeWorkspaceId),
    refetchInterval: isAuthenticated && hasPartner ? SHARED_DATA_REFETCH_MS : false,
    refetchOnWindowFocus: true,
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
    onSuccess: () => invalidatePaymentRelatedQueries(queryClient),
  });
}

function invalidatePaymentRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
  queryClient.invalidateQueries({ queryKey: ['subscriptionPayments'] });
  queryClient.invalidateQueries({ queryKey: ['accounts'] });
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
  queryClient.invalidateQueries({ queryKey: ['budgets'] });
}

/** Registers the payment of a bill for a specific month (optionally debiting an account). */
export function usePaySubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subId, payload }: { subId: string; payload: PaySubscriptionPayload }) =>
      paySubscription(subId, payload),
    onSuccess: () => invalidatePaymentRelatedQueries(queryClient),
  });
}

/** Undoes the payment of a bill for a specific month (and reverts its expense, if any). */
export function useUndoSubscriptionPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subId, period }: { subId: string; period: SubscriptionPeriod }) =>
      undoSubscriptionPayment(subId, period),
    onSuccess: () => invalidatePaymentRelatedQueries(queryClient),
  });
}

/** Payment history of a bill, most recent month first. */
export function useSubscriptionPayments(subId?: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: ['subscriptionPayments', subId],
    queryFn: () => getSubscriptionPayments(subId!),
    enabled: isAuthenticated && Boolean(subId),
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
    queryKey: ['salaryDistributionConfig', activeWorkspaceId, user?.email, isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) {
        return DEMO_SALARY_CONFIG;
      }
      const { getSalaryDistributionConfig } = await import('../services/subscriptions-service');
      return getSalaryDistributionConfig(activeWorkspaceId!);
    },
    enabled: (!isAuthenticated) || isUuid(activeWorkspaceId),
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
