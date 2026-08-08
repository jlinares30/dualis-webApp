export interface DashboardSummaryDTO {
  totalBalance?: number;
  totalLiquidity?: number;
  currency?: string;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  netSavings?: number;
  savingsRatePercentage?: number;
  savingsRate?: number;
  essentialExpenses?: number;
  nonEssentialExpenses?: number;
  essentialPercentage?: number;
  nonEssentialPercentage?: number;
  essentialExpensesRatio?: number;
  nonEssentialExpensesRatio?: number;
  categoryBreakdown?: CategoryExpenseSummary[];
  categoryExpenses?: CategoryExpenseSummary[];
  activeBudgetsCount?: number;
  exceededBudgetsCount?: number;
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
