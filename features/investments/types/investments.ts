export type InvestmentType = 'STOCKS' | 'CRYPTO' | 'FIXED_TERM' | 'REAL_ESTATE' | 'CROWDLENDING' | 'MUTUAL_FUNDS';

export interface InvestmentDTO {
  id: string;
  name: string;
  type: InvestmentType;
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
