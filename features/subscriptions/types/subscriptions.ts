export interface SubscriptionDTO {
  id: string;
  workspaceId: string;
  name: string;
  amount: number;
  currency: string;
  dueDay: number; // 1-31
  category?: 'HOUSING' | 'UTILITIES' | 'SUBSCRIPTION' | 'HEALTH' | 'EDUCATION' | 'OTHER';
  /** Whether the bill is paid for the requested period (periodYear/periodMonth). */
  isPaidThisMonth?: boolean;
  periodYear?: number;
  periodMonth?: number;
  payment?: SubscriptionPaymentDTO | null;
  provider?: string;
  createdAt?: string;
}

export interface SubscriptionPaymentDTO {
  id: string;
  subscriptionId: string;
  periodYear: number;
  periodMonth: number; // 1-12
  amount: number;
  currency: string;
  paidAt: string;
  paidByEmail?: string;
  transactionId?: string | null;
}

export interface SubscriptionPeriod {
  year: number;
  month: number; // 1-12
}

export interface PaySubscriptionPayload {
  periodYear: number;
  periodMonth: number;
  amount?: number;
  /** When provided, the backend records the EXPENSE on this account. */
  accountId?: string;
}

export interface CreateSubscriptionRequest {
  workspaceId: string;
  name: string;
  amount: number;
  dueDay: number;
  category?: 'HOUSING' | 'UTILITIES' | 'SUBSCRIPTION' | 'HEALTH' | 'EDUCATION' | 'OTHER';
  currency?: string;
  provider?: string;
}

export interface SalaryDistributionBranch {
  id: string;
  destinationType?: 'ACCOUNT' | 'INVESTMENT';
  targetAccountId?: string;
  targetAccountName?: string;
  targetInvestmentId?: string;
  targetInvestmentName?: string;
  targetWorkspaceId?: string;
  workspaceType?: 'PERSONAL' | 'COUPLE';
  mode: 'PERCENTAGE' | 'FIXED';
  value: number; // e.g. 50 (%) or 1500 (PEN)
  label?: string;
}

export interface SalaryDistributionConfig {
  enabled: boolean;
  frequency: 'MONTHLY' | 'BIWEEKLY';
  paymentDay: number; // 1-31
  distributionType: 'TOTAL' | 'SPLIT';
  primaryAccountId?: string; // used if distributionType === 'TOTAL'
  branches: SalaryDistributionBranch[]; // used if distributionType === 'SPLIT'
  autoExecute: boolean;
  lastExecutedDate?: string;
}
