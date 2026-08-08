import { apiFetch } from '../api';

export interface AccountDTO {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit' | 'digital';
  balance: number;
  currency: string;
  accountNumber?: string;
  color?: string;
  workspaceId?: string;
}

export interface CreateAccountRequest {
  name: string;
  type: string;
  initialBalance: number;
  currency?: string;
  accountNumber?: string;
  workspaceId?: string;
}

export async function getAccounts(workspaceId?: string): Promise<AccountDTO[]> {
  const queryParam = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  return apiFetch<AccountDTO[]>(`/accounts${queryParam}`);
}

export async function createAccount(data: CreateAccountRequest): Promise<AccountDTO> {
  return apiFetch<AccountDTO>('/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAccount(id: string, data: Partial<CreateAccountRequest>): Promise<AccountDTO> {
  return apiFetch<AccountDTO>(`/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(id: string): Promise<void> {
  return apiFetch<void>(`/accounts/${id}`, {
    method: 'DELETE',
  });
}

