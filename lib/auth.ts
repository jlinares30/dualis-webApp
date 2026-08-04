import { apiFetch } from './api';

export interface AuthResponse {
  token: string;
  email: string;
  name: string;
  id: string;
}

export interface LoginRequest {
  email: string;
  passwordHash: string; // O password según la convención del backend
}

export interface RegisterRequest {
  email: string;
  passwordHash: string;
  fullName: string;
  preferredCurrency?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  preferredCurrency: string;
}

export async function loginUser(data: { email: string; password?: string; passwordHash?: string }): Promise<AuthResponse> {
  const payload = {
    email: data.email,
    password: data.password || data.passwordHash,
    passwordHash: data.passwordHash || data.password,
  };
  
  const response = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.token && typeof window !== 'undefined') {
    localStorage.setItem('dualis_auth_token', response.token);
  }

  return response;
}

export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (response.token && typeof window !== 'undefined') {
    localStorage.setItem('dualis_auth_token', response.token);
  }

  return response;
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
