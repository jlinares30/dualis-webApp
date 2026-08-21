import { apiFetch } from '@/lib/api';
import { SavingsGoalDTO, CreateGoalRequest } from '@/types';

export async function getGoals(workspaceId?: string): Promise<SavingsGoalDTO[]> {
  if (!workspaceId) return [];
  try {
    return await apiFetch<SavingsGoalDTO[]>(`/goals?workspaceId=${encodeURIComponent(workspaceId)}`);
  } catch {
    return [];
  }
}

export async function createGoal(request: CreateGoalRequest): Promise<SavingsGoalDTO> {
  return apiFetch<SavingsGoalDTO>('/goals', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function depositToGoal(goalId: string, amount: number): Promise<SavingsGoalDTO> {
  return apiFetch<SavingsGoalDTO>(`/goals/${goalId}/deposit`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export async function deleteGoal(goalId: string): Promise<void> {
  return apiFetch<void>(`/goals/${goalId}`, {
    method: 'DELETE',
  });
}
