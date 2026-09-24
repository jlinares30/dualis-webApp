import { apiFetch } from '@/lib/api';
import { AccountDTO, CreateAccountRequest } from '../types/accounts';

export type { AccountDTO, CreateAccountRequest };

export async function getAccounts(workspaceId: string, status?: string): Promise<AccountDTO[]> {
  const query = new URLSearchParams({ workspaceId });
  if (status !== undefined) {
    if (status) query.append('status', status);
  } else {
    // Por defecto consultar solo cuentas activas
    query.append('status', 'ACTIVE');
  }
  return apiFetch<AccountDTO[]>(`/accounts?${query.toString()}`);
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

