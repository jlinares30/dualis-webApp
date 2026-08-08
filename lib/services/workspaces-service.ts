import { apiFetch } from '../api';
import { WorkspaceDTO } from '@/types/finance';

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


export async function getInviteCode(workspaceId?: string): Promise<InviteCodeResponse> {
  if (!workspaceId) {
    return { code: '' };
  }
  const response = await apiFetch<any>(`/workspaces/${workspaceId}/invite`, {
    method: 'POST',
  });
  return {
    code: response.invitationCode || response.code || '',
  };
}

export async function joinWorkspaceByCode(code: string, partnerEmail?: string): Promise<WorkspaceDTO> {
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

