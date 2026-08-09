import { apiFetch } from '../api';

export interface CategoryDTO {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  type: 'INCOME' | 'EXPENSE';
  categoryNature?: 'ESSENTIAL' | 'NON_ESSENTIAL';
  isSystemDefault?: boolean;
  workspaceId?: string;
}

export interface CreateCategoryRequest {
  workspaceId: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
  color?: string;
  categoryNature?: 'ESSENTIAL' | 'NON_ESSENTIAL';
}

export async function getCategories(workspaceId: string, type?: 'INCOME' | 'EXPENSE'): Promise<CategoryDTO[]> {
  const queryParam = new URLSearchParams({ workspaceId });
  if (type) queryParam.append('type', type);
  return apiFetch<CategoryDTO[]>(`/categories?${queryParam.toString()}`);
}

export async function createCategory(data: CreateCategoryRequest): Promise<CategoryDTO> {
  return apiFetch<CategoryDTO>('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
