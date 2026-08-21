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

export interface UpdateProfileRequest {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  preferredCurrency?: string;
  baseCurrency?: string;
}
