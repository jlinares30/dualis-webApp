import { apiFetch } from '@/lib/api';
import { SubscriptionDTO, CreateSubscriptionRequest } from '@/types';
import { PaySubscriptionPayload, SubscriptionPaymentDTO, SubscriptionPeriod } from '../types/subscriptions';

export async function getSubscriptions(workspaceId?: string, period?: SubscriptionPeriod): Promise<SubscriptionDTO[]> {
  if (!workspaceId) return [];
  const query = new URLSearchParams({ workspaceId });
  if (period) {
    query.append('year', String(period.year));
    query.append('month', String(period.month));
  }
  try {
    return await apiFetch<SubscriptionDTO[]>(`/subscriptions?${query.toString()}`);
  } catch {
    return [];
  }
}

export async function paySubscription(subId: string, payload: PaySubscriptionPayload): Promise<SubscriptionDTO> {
  return apiFetch<SubscriptionDTO>(`/subscriptions/${subId}/payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function undoSubscriptionPayment(subId: string, period: SubscriptionPeriod): Promise<SubscriptionDTO> {
  return apiFetch<SubscriptionDTO>(
    `/subscriptions/${subId}/payments?year=${period.year}&month=${period.month}`,
    { method: 'DELETE' }
  );
}

export async function getSubscriptionPayments(subId: string): Promise<SubscriptionPaymentDTO[]> {
  return apiFetch<SubscriptionPaymentDTO[]>(`/subscriptions/${subId}/payments`);
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
