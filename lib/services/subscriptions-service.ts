import { apiFetch } from '../api';
import { SubscriptionDTO, CreateSubscriptionRequest } from '@/types/subscriptions';

export async function getSubscriptions(workspaceId?: string): Promise<SubscriptionDTO[]> {
  if (!workspaceId) return [];
  try {
    return await apiFetch<SubscriptionDTO[]>(`/subscriptions?workspaceId=${encodeURIComponent(workspaceId)}`);
  } catch {
    return [];
  }
}

export async function createSubscription(request: CreateSubscriptionRequest): Promise<SubscriptionDTO> {
  return apiFetch<SubscriptionDTO>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function toggleSubPaidStatus(subId: string): Promise<SubscriptionDTO> {
  return apiFetch<SubscriptionDTO>(`/subscriptions/${subId}/toggle-paid`, {
    method: 'PATCH',
  });
}

export async function deleteSubscription(subId: string): Promise<void> {
  return apiFetch<void>(`/subscriptions/${subId}`, {
    method: 'DELETE',
  });
}
