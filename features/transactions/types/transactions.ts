import { WorkspaceType } from '@/types';

export type CategoryType = 
  | 'food' 
  | 'utilities' 
  | 'entertainment' 
  | 'housing' 
  | 'transport' 
  | 'health' 
  | 'shopping' 
  | 'income';

export type BackendTransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface TransactionDTO {
  id: string;
  workspaceId: string;
  accountId: string;
  accountName?: string;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  amount: number;
  currency: string;
  type: BackendTransactionType;
  description: string;
  transactionDate: string;
  paidByUserId?: string;
  paidByUserName?: string;
  splitRuleId?: string;
  createdAt?: string;
}

export interface CreateTransactionRequest {
  workspaceId: string;
  accountId: string;
  categoryId?: string;
  amount: number;
  currency?: string;
  type: BackendTransactionType;
  description: string;
  transactionDate: string;
  splitRuleId?: string;
}

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
