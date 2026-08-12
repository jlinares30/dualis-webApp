import { apiFetch } from '../api';
import { DebtBalanceSummaryDTO, SettlementDTO, CreateSettlementPayload } from '@/types/settlements';

export async function getDebtBalanceSummary(workspaceId: string): Promise<DebtBalanceSummaryDTO> {
  return apiFetch<DebtBalanceSummaryDTO>(`/settlements/balance-summary?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function getSettlementsByWorkspace(workspaceId: string): Promise<SettlementDTO[]> {
  return apiFetch<SettlementDTO[]>(`/settlements?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function createSettlement(payload: CreateSettlementPayload): Promise<SettlementDTO> {
  return apiFetch<SettlementDTO>('/settlements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function completeSettlement(id: string): Promise<SettlementDTO> {
  return apiFetch<SettlementDTO>(`/settlements/${id}/complete`, {
    method: 'PATCH',
  });
}

export async function cancelSettlement(id: string): Promise<void> {
  return apiFetch<void>(`/settlements/${id}`, {
    method: 'DELETE',
  });
}
