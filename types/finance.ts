export type WorkspaceType = 'personal' | 'couple';

export interface Workspace {
  id: WorkspaceType;
  name: string;
  description: string;
  avatarUrl?: string;
  partnerName?: string;
}

export interface SummaryMetric {
  title: string;
  amount: number;
  currency: string;
  changePercentage: number;
  trend: 'up' | 'down' | 'neutral';
  isPositive: boolean;
  description: string;
}

export type CategoryType = 
  | 'food' 
  | 'utilities' 
  | 'entertainment' 
  | 'housing' 
  | 'transport' 
  | 'health' 
  | 'shopping' 
  | 'income';

export interface Transaction {
  id: string;
  title: string;
  category: CategoryType;
  categoryLabel: string;
  amount: number;
  currency: string;
  date: string;
  type: 'expense' | 'income';
  workspace: WorkspaceType;
  paidBy?: string;
  splitRatio?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  category: CategoryType;
  spent: number;
  limit: number;
  currency: string;
}
