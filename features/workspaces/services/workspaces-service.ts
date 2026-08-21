import { apiFetch } from '@/lib/api';
import { WorkspaceDTO } from '@/types';

export interface InviteCodeResponse {
  code: string;
  expiresAt?: string;
}

export interface CreateWorkspacePayload {
  name: string;
  description?: string;
  type: 'INDIVIDUAL' | 'COUPLE';
  currency?: string;
  ownerEmail: string;
}

export interface UpdateWorkspacePayload {
  name?: string;
  description?: string;
  currency?: string;
}

export interface JoinWorkspacePayload {
  invitationCode: string;
  partnerEmail: string;
}

export async function getUserWorkspaces(userEmail?: string): Promise<WorkspaceDTO[]> {
  const queryParam = userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : '';
  return apiFetch<WorkspaceDTO[]>(`/workspaces${queryParam}`);
}

export async function createWorkspace(data: CreateWorkspacePayload): Promise<WorkspaceDTO> {
  return apiFetch<WorkspaceDTO>('/workspaces', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getWorkspaceById(id: string): Promise<WorkspaceDTO> {
  return apiFetch<WorkspaceDTO>(`/workspaces/${id}`);
}

export async function updateWorkspace(id: string, data: UpdateWorkspacePayload): Promise<WorkspaceDTO> {
  return apiFetch<WorkspaceDTO>(`/workspaces/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getInviteCode(workspaceId?: string): Promise<InviteCodeResponse> {
  if (!workspaceId) {
    return { code: '' };
  }
  try {
    const response = await apiFetch<any>(`/workspaces/${workspaceId}/invite`, {
      method: 'POST',
    });
    return {
      code: response.invitationCode || response.code || '',
    };
  } catch {
    return { code: '' };
  }
}

export async function joinWorkspaceByCode(code: string, partnerEmail: string): Promise<WorkspaceDTO> {
  return apiFetch<WorkspaceDTO>('/workspaces/join', {
    method: 'POST',
    body: JSON.stringify({ invitationCode: code, partnerEmail }),
  });
}

export async function unlinkPartnerWorkspace(workspaceId: string): Promise<void> {
  return apiFetch<void>(`/workspaces/${workspaceId}`, {
    method: 'DELETE',
  });
}


