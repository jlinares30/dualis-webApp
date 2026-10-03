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
  targetAccountId?: string;
  targetAccountName?: string;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  amount: number;
  currency: string;
  type: BackendTransactionType;
  description: string;
  exchangeRate?: number;
  originalAmount?: number;
  originalCurrency?: string;
  transactionDate: string;
  paidByUserId?: string;
  paidByUserName?: string;
  splitRuleId?: string;
  createdAt?: string;
}

export interface CreateTransactionRequest {
  workspaceId: string;
  accountId: string;
  targetAccountId?: string;
  categoryId?: string;
  categoryNature?: 'ESSENTIAL' | 'NON_ESSENTIAL' | string;
  amount: number;
  currency?: string;
  type: BackendTransactionType;
  description: string;
  exchangeRate?: number;
  originalAmount?: number;
  originalCurrency?: string;
  transactionDate: string;
  splitRuleId?: string;
}

export interface Transaction {
  id: string;
  title: string;
  category: CategoryType;
  categoryLabel: string;
  categoryId?: string;
  amount: number;
  currency: string;
  date: string;
  rawDate?: string;
  type: 'expense' | 'income' | 'transfer';
  workspace: WorkspaceType;
  accountId?: string;
  accountName?: string;
  targetAccountId?: string;
  targetAccountName?: string;
  exchangeRate?: number;
  originalAmount?: number;
  originalCurrency?: string;
  paidBy?: string;
  splitRatio?: string;
}
