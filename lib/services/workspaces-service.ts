import { apiFetch } from '../api';
import { WorkspaceDTO } from '@/types/finance';

export interface InviteCodeResponse {
  code: string;
  expiresAt?: string;
}

export async function getUserWorkspaces(userEmail?: string): Promise<WorkspaceDTO[]> {
  const queryParam = userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : '';
  return apiFetch<WorkspaceDTO[]>(`/workspaces${queryParam}`);
}

export async function getWorkspaceById(id: string): Promise<WorkspaceDTO> {
  return apiFetch<WorkspaceDTO>(`/workspaces/${id}`);
}

export async function getInviteCode(): Promise<InviteCodeResponse> {
  return apiFetch<InviteCodeResponse>('/workspaces/invite-code');
}

export async function joinWorkspaceByCode(code: string): Promise<WorkspaceDTO> {
  return apiFetch<WorkspaceDTO>('/workspaces/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function unlinkPartnerWorkspace(workspaceId: string): Promise<void> {
  return apiFetch<void>(`/workspaces/${workspaceId}/unlink`, {
    method: 'POST',
  });
}
