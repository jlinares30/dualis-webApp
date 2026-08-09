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
  workspaceId: string;
  name: string;
  categoryId?: string;
  amount?: number;
  limitAmount?: number;
  currency?: string;
  periodMonth?: number;
  periodYear?: number;
}

export async function getBudgets(workspaceId?: string): Promise<BudgetDTO[]> {
  if (!workspaceId) return [];
  const budgets = await apiFetch<any[]>(`/budgets?workspaceId=${encodeURIComponent(workspaceId)}`);

  const budgetsWithProgress = await Promise.all(
    budgets.map(async (b) => {
      try {
        const progress = await apiFetch<any>(`/budgets/${b.id}/progress`);
        return {
          id: b.id,
          name: b.name,
          categoryId: b.categoryId,
          categoryName: progress.name || b.name,
          limitAmount: b.amount || progress.limitAmount || 0,
          spentAmount: progress.spentAmount ?? 0,
          currency: b.currency || progress.currency || 'PEN',
          workspaceId: b.workspaceId,
        };
      } catch {
        return {
          id: b.id,
          name: b.name,
          categoryId: b.categoryId,
          limitAmount: b.amount || 0,
          spentAmount: 0,
          currency: b.currency || 'PEN',
          workspaceId: b.workspaceId,
        };
      }
    })
  );

  return budgetsWithProgress;
}

export async function createBudget(data: CreateBudgetRequest): Promise<BudgetDTO> {
  const now = new Date();
  const isUuidCategory = data.categoryId && /^[0-9a-fA-F-]{36}$/.test(data.categoryId);

  const payload = {
    workspaceId: data.workspaceId,
    name: data.name,
    categoryId: isUuidCategory ? data.categoryId : undefined,
    amount: data.amount ?? data.limitAmount ?? 0,
    currency: data.currency || 'PEN',
    periodMonth: data.periodMonth || (now.getMonth() + 1),
    periodYear: data.periodYear || now.getFullYear(),
  };

  return apiFetch<BudgetDTO>('/budgets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteBudget(id: string): Promise<void> {
  return apiFetch<void>(`/budgets/${id}`, {
    method: 'DELETE',
  });
}
