import { apiFetch } from '@/lib/api';
import { InvestmentDTO, CreateInvestmentRequest, InvestmentType } from '../types/investments';

export type { InvestmentDTO, CreateInvestmentRequest, InvestmentType };

export interface UpdateInvestmentRequest {
  name?: string;
  institution?: string;
  type?: string;
  initialCapital?: number;
  currentValue?: number;
}

export async function getInvestments(workspaceId?: string): Promise<InvestmentDTO[]> {
  if (!workspaceId) return [];
  const response = await apiFetch<InvestmentDTO[]>(`/investments?workspaceId=${workspaceId}`);
  return response || [];
}

export async function createInvestment(data: CreateInvestmentRequest): Promise<InvestmentDTO> {
  return apiFetch<InvestmentDTO>('/investments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInvestment(id: string, data: UpdateInvestmentRequest): Promise<InvestmentDTO> {
  return apiFetch<InvestmentDTO>(`/investments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteInvestment(id: string): Promise<void> {
  return apiFetch<void>(`/investments/${id}`, {
    method: 'DELETE',
  });
}

