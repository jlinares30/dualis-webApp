export interface SavingsGoalDTO {
  id: string;
  workspaceId: string;
  accountId?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadlineDate?: string;
  category?: 'EMERGENCY' | 'TRAVEL' | 'HOUSE' | 'CAR' | 'TECH' | 'OTHER';
  currency: string;
  icon?: string;
  createdAt?: string;
}

export interface CreateGoalRequest {
  workspaceId: string;
  accountId?: string;
  name: string;
  targetAmount: number;
  currentAmount?: number;
  deadlineDate?: string;
  category?: 'EMERGENCY' | 'TRAVEL' | 'HOUSE' | 'CAR' | 'TECH' | 'OTHER';
  currency?: string;
}

export interface UpdateGoalRequest {
  accountId?: string;
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadlineDate?: string;
  category?: 'EMERGENCY' | 'TRAVEL' | 'HOUSE' | 'CAR' | 'TECH' | 'OTHER';
  currency?: string;
}

