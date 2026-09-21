import { apiFetch } from '@/lib/api';
import { UserProfile, UpdateProfileRequest } from '../types/auth';

export type { UpdateProfileRequest };

function formatFullName(firstName?: string, lastName?: string, fallback?: string): string {
  const f = (firstName || '').trim();
  const l = (lastName || '').trim();
  if (f && l && f.toLowerCase() === l.toLowerCase()) {
    return f;
  }
  return `${f} ${l}`.trim() || fallback || '';
}

export async function getUserProfile(): Promise<UserProfile> {
  const data = await apiFetch<any>('/auth/me');
  return {
    id: data.id,
    email: data.email,
    fullName: formatFullName(data.firstName, data.lastName, data.email),
    preferredCurrency: data.baseCurrency || data.preferredCurrency || 'PEN',
  };
}

export async function updateUserProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  const parts = (data.fullName || '').trim().split(' ');
  const firstName = data.firstName || parts[0] || '';
  const lastName = data.lastName !== undefined ? data.lastName : parts.slice(1).join(' ');
  const baseCurrency = data.baseCurrency || data.preferredCurrency || 'PEN';

  const body = {
    firstName: firstName || 'Usuario',
    lastName: lastName || '',
    baseCurrency: baseCurrency,
  };

  const response = await apiFetch<any>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  return {
    id: response.id,
    email: response.email,
    fullName: formatFullName(response.firstName, response.lastName, response.email),
    preferredCurrency: response.baseCurrency || response.preferredCurrency || 'PEN',
  };
}
