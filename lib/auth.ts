import { apiFetch } from './api';

export interface BackendAuthResponse {
  accessToken: string;
  tokenType: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  baseCurrency?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  preferredCurrency: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  name: string;
  id: string;
}

function formatFullName(firstName?: string, lastName?: string, fallback?: string): string {
  const f = (firstName || '').trim();
  const l = (lastName || '').trim();
  if (f && l && f.toLowerCase() === l.toLowerCase()) {
    return f;
  }
  return `${f} ${l}`.trim() || fallback || '';
}

export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const payload: LoginRequest = {
    email: data.email,
    password: data.password,
  };

  const response = await apiFetch<BackendAuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const authResponse: AuthResponse = {
    token: response.accessToken,
    email: response.email,
    name: formatFullName(response.firstName, response.lastName, response.email),
    id: response.userId,
  };

  if (authResponse.token && typeof window !== 'undefined') {
    localStorage.setItem('dualis_auth_token', authResponse.token);
  }

  return authResponse;
}

export async function registerUser(data: { email: string; password: string; fullName: string; baseCurrency?: string }): Promise<AuthResponse> {
  const parts = data.fullName.trim().split(' ');
  const firstName = parts[0] || 'Usuario';
  const lastName = parts.slice(1).join(' ');

  const payload: RegisterRequest = {
    email: data.email,
    password: data.password,
    firstName,
    lastName: lastName || '',
  };

  const response = await apiFetch<BackendAuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const authResponse: AuthResponse = {
    token: response.accessToken,
    email: response.email,
    name: formatFullName(response.firstName, response.lastName, response.email),
    id: response.userId,
  };

  if (authResponse.token && typeof window !== 'undefined') {
    localStorage.setItem('dualis_auth_token', authResponse.token);
  }

  return authResponse;
}

export async function getMe(): Promise<UserProfile> {
  const data = await apiFetch<any>('/auth/me');
  return {
    id: data.id,
    email: data.email,
    fullName: formatFullName(data.firstName, data.lastName, data.email),
    preferredCurrency: data.baseCurrency || data.preferredCurrency || 'PEN',
  };
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dualis_auth_token');
    window.location.reload();
  }
}
