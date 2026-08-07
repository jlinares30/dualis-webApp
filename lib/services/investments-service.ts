import { apiFetch } from '../api';

export interface InvestmentDTO {
  id: string;
  name: string;
  type: 'STOCKS' | 'CRYPTO' | 'FIXED_TERM' | 'REAL_ESTATE' | 'CROWDLENDING' | 'MUTUAL_FUNDS';
  institution: string;
  initialCapital: number;
  currentValue: number;
  returnsAmount: number;
  returnsPercentage: number;
  currency: string;
  workspaceId?: string;
  createdAt?: string;
}

export interface CreateInvestmentRequest {
  name: string;
  type: string;
  institution: string;
  initialCapital: number;
  currentValue?: number;
  currency?: string;
  workspaceId?: string;
}

export async function getInvestments(workspaceId?: string): Promise<InvestmentDTO[]> {
  const queryParam = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  return apiFetch<InvestmentDTO[]>(`/investments${queryParam}`);
}

export async function createInvestment(data: CreateInvestmentRequest): Promise<InvestmentDTO> {
  return apiFetch<InvestmentDTO>('/investments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteInvestment(id: string): Promise<void> {
  return apiFetch<void>(`/investments/${id}`, {
    method: 'DELETE',
  });
}
