import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUserWorkspaces, 
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  UpdateWorkspacePayload,
  getInviteCode, 
  joinWorkspaceByCode, 
  unlinkPartnerWorkspace 
} from '@/lib/services';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

export function useWorkspaces() {

  const { isAuthenticated, user } = useAuthStore();
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);

  return useQuery({
    queryKey: ['workspaces', user?.email],
    queryFn: async () => {
      let data = await getUserWorkspaces(user?.email || undefined);
      
      // Si el usuario es nuevo y no tiene ningún workspace creado aún en la BD:
      if (data.length === 0 && user?.email) {
        try {
          const defaultWorkspace = await createWorkspace({
            name: 'Espacio Personal',
            description: 'Espacio de finanzas personales',
            type: 'INDIVIDUAL',
            currency: 'PEN',
            ownerEmail: user.email,
          });
          data = [defaultWorkspace];
        } catch (e) {
          console.error('Error al autocrear espacio personal:', e);
        }
      }

      setWorkspaces(data);
      return data;
    },
    enabled: isAuthenticated && Boolean(user?.email),
  });
}

export function useWorkspaceDetails(workspaceId?: string | null) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isValidUuid = workspaceId && /^[0-9a-fA-F-]{36}$/.test(workspaceId);

  return useQuery({
    queryKey: ['workspaceDetails', workspaceId],
    queryFn: () => getWorkspaceById(workspaceId!),
    enabled: isAuthenticated && Boolean(isValidUuid),
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; description?: string; type: 'INDIVIDUAL' | 'COUPLE'; currency?: string; ownerEmail: string }) =>
      createWorkspace(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkspacePayload }) => updateWorkspace(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}

export function useInviteCode() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const isValidUuid = activeWorkspaceId && /^[0-9a-fA-F-]{36}$/.test(activeWorkspaceId);
  const isCoupleWorkspace = activeWs?.type === 'COUPLE';

  return useQuery({
    queryKey: ['inviteCode', activeWorkspaceId],
    queryFn: () => getInviteCode(activeWorkspaceId!),
    enabled: isAuthenticated && Boolean(isValidUuid) && Boolean(isCoupleWorkspace),
    retry: false,
  });
}

export function useJoinWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ code, partnerEmail }: { code: string; partnerEmail: string }) => 
      joinWorkspaceByCode(code, partnerEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspaceDetails'] });
      queryClient.invalidateQueries({ queryKey: ['debtBalanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });
}

export function useUnlinkPartner() {
  const queryClient = useQueryClient();
  const unlinkPartner = useWorkspaceStore((state) => state.unlinkPartner);

  return useMutation({
    mutationFn: (workspaceId: string) => unlinkPartnerWorkspace(workspaceId),
    onSuccess: () => {
      unlinkPartner();
      queryClient.invalidateQueries();
    },
  });
}

