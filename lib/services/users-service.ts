import { apiFetch } from '../api';
import { UserProfile } from '../auth';

export interface UpdateProfileRequest {
  fullName: string;
  preferredCurrency?: string;
}

export async function getUserProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me');
}

export async function updateUserProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
