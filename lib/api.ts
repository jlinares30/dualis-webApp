const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('dualis_auth_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }

    if (response.status === 401 && typeof window !== 'undefined') {
      // Manejar token expirado o no autorizado
      localStorage.removeItem('dualis_auth_token');
    }



    let errorMessage = `HTTP Error ${response.status}`;
    if (errorData) {
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData.details && typeof errorData.details === 'object') {
        errorMessage = Object.entries(errorData.details)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ');
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (Array.isArray(errorData.errors)) {
        errorMessage = errorData.errors.map((e: any) => e.defaultMessage || e.message || JSON.stringify(e)).join(', ');
      } else if (typeof errorData === 'object') {
        errorMessage = Object.entries(errorData)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ');
      }
    }


    throw new ApiError(
      response.status,
      errorMessage,
      errorData
    );

  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return response.json();
}
