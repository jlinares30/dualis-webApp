import { apiFetch } from '@/lib/api';
import { SubscriptionDTO, CreateSubscriptionRequest } from '@/types';

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

export async function getSalaryDistributionConfig(
  workspaceId?: string,
  userEmail?: string
): Promise<any | null> {
  if (!workspaceId) return null;
  const emailParam = userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : '';
  try {
    return await apiFetch<any>(
      `/subscriptions/salary-distribution?workspaceId=${encodeURIComponent(workspaceId)}${emailParam}`
    );
  } catch {
    return null;
  }
}

export async function saveSalaryDistributionConfig(
  payload: any
): Promise<any> {
  return apiFetch<any>('/subscriptions/salary-distribution', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
