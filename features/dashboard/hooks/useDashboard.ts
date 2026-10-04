import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '@/lib/services';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

import { DEMO_DASHBOARD_SUMMARY } from '@/lib/mock-demo-data';

export function useDashboardSummary() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const hasPartner = useWorkspaceStore((state) => state.hasPartner);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isValidUuid = activeWorkspaceId && /^[0-9a-fA-F-]{36}$/.test(activeWorkspaceId);

  return useQuery({
    queryKey: ['dashboardSummary', activeWorkspaceId, isAuthenticated],
    queryFn: () => {
      if (!isAuthenticated) {
        return DEMO_DASHBOARD_SUMMARY;
      }
      return getDashboardSummary(activeWorkspaceId!);
    },
    enabled: (!isAuthenticated) || Boolean(isValidUuid),
    refetchInterval: isAuthenticated && hasPartner ? 5000 : false,
    refetchIntervalInBackground: false,
  });
}
