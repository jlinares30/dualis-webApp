import { apiFetch } from '@/lib/api';
import { BudgetDTO, CreateBudgetRequest } from '../types/budgets';

export type { BudgetDTO, CreateBudgetRequest };

// Cache en memoria para progresos de presupuestos (TTL de 60 segundos)
const progressCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000;

export async function getBudgets(workspaceId?: string, month?: number, year?: number): Promise<BudgetDTO[]> {
  if (!workspaceId) return [];
  const params = new URLSearchParams({ workspaceId });
  if (month !== undefined) params.append('month', month.toString());
  if (year !== undefined) params.append('year', year.toString());

  const budgets = await apiFetch<any[]>(`/budgets?${params.toString()}`);

  return budgets.map((b) => ({
    id: b.budgetId || b.id,
    name: b.name,
    categoryId: b.categoryId,
    categoryName: b.name,
    limitAmount: b.limitAmount || b.amount || 0,
    spentAmount: b.spentAmount ?? 0,
    currency: b.currency || 'PEN',
    workspaceId: b.workspaceId,
    status: b.status,
  }));
}

export function clearBudgetProgressCache(budgetId?: string) {
  if (budgetId) {
    progressCache.delete(budgetId);
  } else {
    progressCache.clear();
  }
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

  clearBudgetProgressCache();

  return apiFetch<BudgetDTO>('/budgets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateBudget(id: string, data: Partial<CreateBudgetRequest>): Promise<BudgetDTO> {
  const isUuidCategory = data.categoryId && /^[0-9a-fA-F-]{36}$/.test(data.categoryId);
  const payload: any = { ...data };
  if (data.categoryId !== undefined) {
    payload.categoryId = isUuidCategory ? data.categoryId : null;
  }
  if (data.amount !== undefined || data.limitAmount !== undefined) {
    payload.amount = data.amount ?? data.limitAmount;
  }

  clearBudgetProgressCache(id);

  return apiFetch<BudgetDTO>(`/budgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteBudget(id: string): Promise<void> {
  clearBudgetProgressCache(id);
  return apiFetch<void>(`/budgets/${id}`, {
    method: 'DELETE',
  });
}
