import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '@/lib/services';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export function useDashboardSummary() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const hasPartner = useWorkspaceStore((state) => state.hasPartner);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isValidUuid = activeWorkspaceId && /^[0-9a-fA-F-]{36}$/.test(activeWorkspaceId);

  return useQuery({
    queryKey: ['dashboardSummary', activeWorkspaceId],
    queryFn: () => getDashboardSummary(activeWorkspaceId!),
    enabled: isAuthenticated && Boolean(isValidUuid),
    refetchInterval: hasPartner ? 5000 : false,
    refetchIntervalInBackground: false,
  });
}
