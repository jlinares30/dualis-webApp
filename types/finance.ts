export type WorkspaceType = 'INDIVIDUAL' | 'COUPLE' | 'personal' | 'couple';

export interface WorkspaceDTO {
  id: string;
  name: string;
  type: 'INDIVIDUAL' | 'COUPLE';
  description?: string;
  inviteCode?: string;
  members?: WorkspaceMemberDTO[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceMemberDTO {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: 'OWNER' | 'PARTNER' | 'MEMBER';
}

export interface Workspace {
  id: WorkspaceType;
  name: string;
  description: string;
  avatarUrl?: string;
  partnerName?: string;
}

export interface DashboardSummaryDTO {
  totalLiquidity: number;
  currency: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  netSavings: number;
  savingsRate: number;
  essentialExpensesRatio: number;
  nonEssentialExpensesRatio: number;
  partnerDebtBalance: number;
  partnerDebtStatus: string;
  categoryExpenses: CategoryExpenseSummary[];
  activeBudgetsCount: number;
  exceededBudgetsCount: number;
}

export interface CategoryExpenseSummary {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  totalSpent: number;
  percentage: number;
}

export interface SummaryMetric {
  title: string;
  amount: number;
  currency: string;
  changePercentage: number;
  trend: 'up' | 'down' | 'neutral';
  isPositive: boolean;
  description: string;
}

export type CategoryType = 
  | 'food' 
  | 'utilities' 
  | 'entertainment' 
  | 'housing' 
  | 'transport' 
  | 'health' 
  | 'shopping' 
  | 'income';

export type BackendTransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface TransactionDTO {
  id: string;
  workspaceId: string;
  accountId: string;
  accountName?: string;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  amount: number;
  currency: string;
  type: BackendTransactionType;
  description: string;
  transactionDate: string;
  paidByUserId?: string;
  paidByUserName?: string;
  splitRuleId?: string;
  createdAt?: string;
}

export interface CreateTransactionRequest {
  workspaceId: string;
  accountId: string;
  categoryId?: string;
  amount: number;
  currency?: string;
  type: BackendTransactionType;
  description: string;
  transactionDate: string;
  splitRuleId?: string;
}

export interface Transaction {
  id: string;
  title: string;
  category: CategoryType;
  categoryLabel: string;
  amount: number;
  currency: string;
  date: string;
  type: 'expense' | 'income';
  workspace: WorkspaceType;
  paidBy?: string;
  splitRatio?: string;
}

export interface BudgetDTO {
  id: string;
  workspaceId: string;
  categoryId?: string;
  categoryName?: string;
  monthlyLimit: number;
  currentSpent: number;
  currency: string;
  month: number;
  year: number;
  status: 'ON_TRACK' | 'WARNING' | 'EXCEEDED';
}

export interface BudgetCategory {
  id: string;
  name: string;
  category: CategoryType;
  spent: number;
  limit: number;
  currency: string;
}

