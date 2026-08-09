import { apiFetch } from '../api';

export interface AccountDTO {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  accountNumber?: string;
  description?: string;
  color?: string;
  workspaceId?: string;
}

export interface CreateAccountRequest {
  workspaceId: string;
  name: string;
  type: 'BANK' | 'CASH' | 'CREDIT_CARD' | 'INVESTMENT' | 'SAVINGS' | 'LOAN' | string;
  balance: number;
  initialBalance?: number;
  currency?: string;
  description?: string;
}

export async function getAccounts(workspaceId: string): Promise<AccountDTO[]> {
  return apiFetch<AccountDTO[]>(`/accounts?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function createAccount(data: CreateAccountRequest): Promise<AccountDTO> {
  const payload = {
    workspaceId: data.workspaceId,
    name: data.name,
    type: data.type.toUpperCase(),
    balance: data.balance ?? data.initialBalance ?? 0,
    currency: data.currency || 'PEN',
    description: data.description || '',
  };

  return apiFetch<AccountDTO>('/accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
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

