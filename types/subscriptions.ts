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
