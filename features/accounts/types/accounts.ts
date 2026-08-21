export type AccountCategory = 'bank' | 'cash' | 'credit' | 'digital' | 'investment';

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

export interface AccountItem {
  id: string;
  name: string;
  type: AccountCategory;
  balance: number;
  currency: string;
  accountNumber?: string;
  color: string;
  workspace?: 'personal' | 'couple';
}
