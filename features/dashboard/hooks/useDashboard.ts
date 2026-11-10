import { useQuery } from '@tanstack/react-query';
import { SHARED_DATA_REFETCH_MS } from '@/lib/query-config';
import { getDashboardSummary } from '@/lib/services';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

import { DEMO_DASHBOARD_SUMMARY } from '@/lib/mock-demo-data';

/** Backend summary (converted to the workspace currency) for a given month; defaults to the current month. */
export function useDashboardSummary(period?: { year: number; month: number }) {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const hasPartner = useWorkspaceStore((state) => state.hasPartner);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isValidUuid = activeWorkspaceId && /^[0-9a-fA-F-]{36}$/.test(activeWorkspaceId);

  return useQuery({
    queryKey: ['dashboardSummary', activeWorkspaceId, isAuthenticated, period?.year ?? null, period?.month ?? null],
    queryFn: () => {
      if (!isAuthenticated) {
        return DEMO_DASHBOARD_SUMMARY;
      }
      return getDashboardSummary(activeWorkspaceId!, period);
    },
    enabled: (!isAuthenticated) || Boolean(isValidUuid),
    refetchInterval: isAuthenticated && hasPartner ? SHARED_DATA_REFETCH_MS : false,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });
}
