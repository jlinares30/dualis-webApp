import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGoals, createGoal, updateGoal, depositToGoal, deleteGoal } from '@/lib/services';
import { CreateGoalRequest } from '@/types';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

import { DEMO_GOALS } from '@/lib/mock-demo-data';

export function useGoals() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['goals', activeWorkspaceId, isAuthenticated],
    queryFn: () => {
      if (!isAuthenticated) {
        return DEMO_GOALS;
      }
      return getGoals(activeWorkspaceId!);
    },
    enabled: (!isAuthenticated) || Boolean(activeWorkspaceId),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateGoalRequest) => createGoal(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, request }: { goalId: string; request: Partial<CreateGoalRequest> }) =>
      updateGoal(goalId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useDepositGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, amount }: { goalId: string; amount: number }) => depositToGoal(goalId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => deleteGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
