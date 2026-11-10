import { apiFetch } from '@/lib/api';
import { DashboardSummaryDTO } from '@/types';

export async function getDashboardSummary(
  workspaceId?: string,
  period?: { year: number; month: number }
): Promise<DashboardSummaryDTO> {
  const query = new URLSearchParams();
  if (workspaceId) query.append('workspaceId', workspaceId);
  if (period) {
    query.append('year', String(period.year));
    query.append('month', String(period.month));
  }
  const qs = query.toString();
  return apiFetch<DashboardSummaryDTO>(`/dashboard/summary${qs ? `?${qs}` : ''}`);
}
