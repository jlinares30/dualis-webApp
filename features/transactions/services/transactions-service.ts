import { apiFetch } from '@/lib/api';
import { TransactionDTO, CreateTransactionRequest } from '@/types';

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export async function getTransactions(params?: {
  workspaceId?: string;
  accountId?: string;
  categoryId?: string;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<TransactionDTO>> {
  const query = new URLSearchParams();
  if (params?.workspaceId) query.append('workspaceId', params.workspaceId);
  if (params?.accountId) query.append('accountId', params.accountId);
  if (params?.categoryId) query.append('categoryId', params.categoryId);
  if (params?.type) query.append('type', params.type);
  if (params?.search && params.search.trim()) query.append('search', params.search.trim());
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);
  if (params?.page !== undefined) query.append('page', params.page.toString());
  if (params?.size !== undefined) query.append('size', params.size.toString());

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<PaginatedResponse<TransactionDTO>>(`/transactions${queryString}`);
}

export async function createTransaction(data: CreateTransactionRequest): Promise<TransactionDTO> {
  return apiFetch<TransactionDTO>('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTransaction(id: string, data: Partial<CreateTransactionRequest>): Promise<TransactionDTO> {
  return apiFetch<TransactionDTO>(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  return apiFetch<void>(`/transactions/${id}`, {
    method: 'DELETE',
  });
}

export async function getTransactionsByWorkspace(workspaceId: string): Promise<TransactionDTO[]> {
  return apiFetch<TransactionDTO[]>(`/transactions/workspace/${workspaceId}`);
}

