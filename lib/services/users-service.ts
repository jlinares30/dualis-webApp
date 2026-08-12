import { apiFetch } from '../api';
import { UserProfile } from '../auth';

export interface UpdateProfileRequest {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  preferredCurrency?: string;
  baseCurrency?: string;
}

export async function getUserProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/auth/me');
}

export async function updateUserProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  const parts = (data.fullName || '').trim().split(' ');
  const firstName = data.firstName || parts[0] || '';
  const lastName = data.lastName || parts.slice(1).join(' ') || '';
  const baseCurrency = data.baseCurrency || data.preferredCurrency || 'PEN';

  const body = {
    firstName: firstName || 'Usuario',
    lastName: lastName || '',
    baseCurrency: baseCurrency,
  };

  return apiFetch<UserProfile>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}
