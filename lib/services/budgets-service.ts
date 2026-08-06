import { apiFetch } from '../api';

export interface BudgetDTO {
  id: string;
  name: string;
  categoryId?: string;
  categoryName?: string;
  limitAmount: number;
  spentAmount: number;
  currency: string;
  workspaceId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateBudgetRequest {
  name: string;
  categoryId?: string;
  limitAmount: number;
  currency?: string;
  workspaceId?: string;
}

export async function getBudgets(workspaceId?: string): Promise<BudgetDTO[]> {
  const queryParam = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  return apiFetch<BudgetDTO[]>(`/budgets${queryParam}`);
}

export async function createBudget(data: CreateBudgetRequest): Promise<BudgetDTO> {
  return apiFetch<BudgetDTO>('/budgets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteBudget(id: string): Promise<void> {
  return apiFetch<void>(`/budgets/${id}`, {
    method: 'DELETE',
  });
}
