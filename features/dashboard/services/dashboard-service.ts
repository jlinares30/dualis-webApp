import { apiFetch } from '@/lib/api';
import { DashboardSummaryDTO } from '@/types';

export async function getDashboardSummary(workspaceId?: string): Promise<DashboardSummaryDTO> {
  const queryParam = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  return apiFetch<DashboardSummaryDTO>(`/dashboard/summary${queryParam}`);
}
