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
    name: `${response.firstName || ''} ${response.lastName || ''}`.trim() || response.email,
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
  const lastName = parts.slice(1).join(' ') || firstName;

  const payload: RegisterRequest = {
    email: data.email,
    password: data.password,
    firstName,
    lastName,
    baseCurrency: data.baseCurrency || 'PEN',
  };

  const response = await apiFetch<BackendAuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const authResponse: AuthResponse = {
    token: response.accessToken,
    email: response.email,
    name: `${response.firstName || ''} ${response.lastName || ''}`.trim() || response.email,
    id: response.userId,
  };

  if (authResponse.token && typeof window !== 'undefined') {
    localStorage.setItem('dualis_auth_token', authResponse.token);
  }


  return authResponse;
}

export async function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/auth/me');
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dualis_auth_token');
    window.location.reload();
  }
}
