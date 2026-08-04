import { apiFetch } from '../api';
import { WorkspaceDTO } from '@/types/finance';

export async function getUserWorkspaces(userEmail?: string): Promise<WorkspaceDTO[]> {
  const queryParam = userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : '';
  return apiFetch<WorkspaceDTO[]>(`/workspaces${queryParam}`);
}

export async function getWorkspaceById(id: string): Promise<WorkspaceDTO> {
  return apiFetch<WorkspaceDTO>(`/workspaces/${id}`);
}
