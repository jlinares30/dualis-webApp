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
}

export interface UpdateWorkspacePayload {
  name?: string;
  description?: string;
  currency?: string;
}

export interface JoinWorkspacePayload {
  invitationCode: string;
}

/** Workspaces of the authenticated user (the backend identifies the user from the token). */
export async function getUserWorkspaces(): Promise<WorkspaceDTO[]> {
  return apiFetch<WorkspaceDTO[]>('/workspaces');
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

/** Joins a couple workspace as the authenticated user. */
export async function joinWorkspaceByCode(code: string): Promise<WorkspaceDTO> {
  const payload: JoinWorkspacePayload = { invitationCode: code };
  return apiFetch<WorkspaceDTO>('/workspaces/join', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function unlinkPartnerWorkspace(workspaceId: string): Promise<void> {
  return apiFetch<void>(`/workspaces/${workspaceId}`, {
    method: 'DELETE',
  });
}


