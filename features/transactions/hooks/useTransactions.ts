import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '@/lib/services';
import { CreateTransactionRequest } from '@/types';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';
import { clearBudgetProgressCache } from '@/features/budgets';

import { DEMO_TRANSACTIONS } from '@/lib/mock-demo-data';

export function useTransactions(
  page = 0,
  size = 10,
  accountId?: string,
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER',
  search?: string,
  startDate?: string,
  endDate?: string,
  categoryId?: string
) {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const hasPartner = useWorkspaceStore((state) => state.hasPartner);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isValidUuid = activeWorkspaceId && /^[0-9a-fA-F-]{36}$/.test(activeWorkspaceId);

  return useQuery({
    queryKey: ['transactions', activeWorkspaceId, page, size, accountId, type, search, startDate, endDate, categoryId, isAuthenticated],
    queryFn: () => {
      if (!isAuthenticated) {
        let filtered = [...DEMO_TRANSACTIONS];
        if (type) filtered = filtered.filter((t) => t.type === type);
        if (accountId) filtered = filtered.filter((t) => t.accountId === accountId);
        if (search) {
          const lower = search.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.description?.toLowerCase().includes(lower) ||
              t.categoryName?.toLowerCase().includes(lower)
          );
        }
        const start = page * size;
        const paged = filtered.slice(start, start + size);
        return {
          content: paged,
          totalElements: filtered.length,
          totalPages: Math.ceil(filtered.length / size) || 1,
          size,
          number: page,
        };
      }

      return getTransactions({
        workspaceId: activeWorkspaceId!,
        page,
        size,
        accountId,
        categoryId,
        type,
        search,
        startDate,
        endDate,
      });
    },
    enabled: (!isAuthenticated) || Boolean(isValidUuid),
    refetchInterval: isAuthenticated && hasPartner ? 5000 : false,
    refetchIntervalInBackground: false,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newTx: CreateTransactionRequest) => createTransaction(newTx),
    onSuccess: () => {
      clearBudgetProgressCache();
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['debtBalanceSummary'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionRequest> }) => updateTransaction(id, data),
    onSuccess: () => {
      clearBudgetProgressCache();
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['debtBalanceSummary'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      clearBudgetProgressCache();
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['debtBalanceSummary'] });
    },
  });
}

