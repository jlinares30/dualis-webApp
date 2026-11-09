import { apiFetch } from '@/lib/api';

export type SplitType = 'EQUAL' | 'PROPORTIONAL' | 'CUSTOM_PERCENTAGE' | 'FIXED_AMOUNT';

export interface SplitRuleDTO {
  id: string;
  workspaceId: string;
  name: string;
  splitType: SplitType;
  partnerAPercentage?: number;
  partnerBPercentage?: number;
  /** null when partner A keeps it private and the viewer is partner B */
  partnerAIncome?: number | null;
  /** null when partner B keeps it private and the viewer is partner A */
  partnerBIncome?: number | null;
  partnerAIncomeHidden?: boolean;
  partnerBIncomeHidden?: boolean;
  partnerAFixedAmount?: number;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSplitRulePayload {
  workspaceId: string;
  name: string;
  splitType: SplitType;
  partnerAPercentage?: number;
  partnerBPercentage?: number;
  /** Only applied when sent by partner A (workspace owner) */
  partnerAIncome?: number;
  /** Only applied when sent by partner B */
  partnerBIncome?: number;
  partnerAIncomeHidden?: boolean;
  partnerBIncomeHidden?: boolean;
  partnerAFixedAmount?: number;
  isDefault?: boolean;
}

export async function getSplitRulesByWorkspace(workspaceId: string): Promise<SplitRuleDTO[]> {
  return apiFetch<SplitRuleDTO[]>(`/split-rules?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function getSplitRuleById(id: string): Promise<SplitRuleDTO> {
  return apiFetch<SplitRuleDTO>(`/split-rules/${id}`);
}

export async function createSplitRule(payload: CreateSplitRulePayload): Promise<SplitRuleDTO> {
  return apiFetch<SplitRuleDTO>('/split-rules', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSplitRule(id: string, payload: Partial<CreateSplitRulePayload>): Promise<SplitRuleDTO> {
  return apiFetch<SplitRuleDTO>(`/split-rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteSplitRule(id: string): Promise<void> {
  return apiFetch<void>(`/split-rules/${id}`, {
    method: 'DELETE',
  });
}
