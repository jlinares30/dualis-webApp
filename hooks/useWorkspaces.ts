import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUserWorkspaces, 
  getInviteCode, 
  joinWorkspaceByCode, 
  unlinkPartnerWorkspace 
} from '@/lib/services/workspaces-service';
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

export function useInviteCode() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['inviteCode'],
    queryFn: () => getInviteCode(),
    enabled: isAuthenticated,
  });
}

export function useJoinWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => joinWorkspaceByCode(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}

export function useUnlinkPartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) => unlinkPartnerWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}
