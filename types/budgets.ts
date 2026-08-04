import { CategoryType } from './transactions';

export interface BudgetDTO {
  id: string;
  workspaceId: string;
  categoryId?: string;
  categoryName?: string;
  monthlyLimit: number;
  currentSpent: number;
  currency: string;
  month: number;
  year: number;
  status: 'ON_TRACK' | 'WARNING' | 'EXCEEDED';
}

export interface BudgetCategory {
  id: string;
  name: string;
  category: CategoryType;
  spent: number;
  limit: number;
  currency: string;
}
