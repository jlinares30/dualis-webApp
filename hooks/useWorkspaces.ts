import { useQuery } from '@tanstack/react-query';
import { getUserWorkspaces } from '@/lib/services/workspaces-service';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export function useWorkspaces() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);

  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const data = await getUserWorkspaces();
      setWorkspaces(data);
      return data;
    },
    enabled: isAuthenticated,
  });
}
