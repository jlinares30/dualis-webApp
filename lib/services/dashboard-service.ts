import { apiFetch } from '../api';
import { DashboardSummaryDTO } from '@/types/finance';

export async function getDashboardSummary(workspaceId?: string): Promise<DashboardSummaryDTO> {
  const queryParam = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  return apiFetch<DashboardSummaryDTO>(`/dashboard/summary${queryParam}`);
}
