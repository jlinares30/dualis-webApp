import { apiFetch } from '../api';
import { TransactionDTO, CreateTransactionRequest } from '@/types/finance';

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export async function getTransactions(params?: {
  workspaceId?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<TransactionDTO>> {
  const query = new URLSearchParams();
  if (params?.workspaceId) query.append('workspaceId', params.workspaceId);
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

