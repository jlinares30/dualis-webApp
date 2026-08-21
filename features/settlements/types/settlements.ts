export interface DebtBalanceSummaryDTO {
  workspaceId: string;
  totalSharedExpenses: number;
  partnerAEmail?: string;
  partnerAPaidTotal: number;
  partnerAShareTotal: number;
  partnerBEmail?: string;
  partnerBPaidTotal: number;
  partnerBShareTotal: number;
  totalSettledAmount: number;
  netBalance: number;
  debtorEmail?: string | null;
  creditorEmail?: string | null;
  summaryText?: string;
}

export type SettlementStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface SettlementDTO {
  id: string;
  workspaceId: string;
  payerEmail: string;
  recipientEmail: string;
  amount: number;
  currency: string;
  status: SettlementStatus;
  note?: string;
  settledAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSettlementPayload {
  workspaceId: string;
  payerEmail: string;
  recipientEmail: string;
  amount: number;
  currency: string;
  note?: string;
}
