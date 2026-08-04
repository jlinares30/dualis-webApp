import { apiFetch } from '../api';
import { BudgetDTO } from '@/types/finance';

export async function getBudgets(workspaceId?: string): Promise<BudgetDTO[]> {
  const queryParam = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  return apiFetch<BudgetDTO[]>(`/budgets${queryParam}`);
}
