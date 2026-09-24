export interface SubscriptionDTO {
  id: string;
  workspaceId: string;
  name: string;
  amount: number;
  currency: string;
  dueDay: number; // 1-31
  category?: 'HOUSING' | 'UTILITIES' | 'SUBSCRIPTION' | 'HEALTH' | 'EDUCATION' | 'OTHER';
  isPaidThisMonth?: boolean;
  provider?: string;
  createdAt?: string;
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
