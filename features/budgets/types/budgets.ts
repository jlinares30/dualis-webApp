import { CategoryType } from '@/types';

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
  status?: 'ON_TRACK' | 'WARNING' | 'EXCEEDED';
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

export interface BudgetCategory {
  id: string;
  name: string;
  category: CategoryType;
  spent: number;
  limit: number;
  currency: string;
}
