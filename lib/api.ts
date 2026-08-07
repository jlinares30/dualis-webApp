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

    throw new ApiError(
      response.status,
      errorData?.message || `HTTP Error ${response.status}`,
      errorData
    );
  }

  if (response.status === 24 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return response.json();
}
