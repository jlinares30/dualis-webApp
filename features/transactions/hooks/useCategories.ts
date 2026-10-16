import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, CreateCategoryRequest, CategoryDTO } from '@/lib/services';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useWorkspaceStore } from '@/lib/stores/useWorkspaceStore';

const DEFAULT_DEMO_CATEGORIES: CategoryDTO[] = [
  { id: 'cat-1', name: 'Alimentación', type: 'EXPENSE', icon: 'ShoppingBag', color: '#10b981' },
  { id: 'cat-2', name: 'Servicios', type: 'EXPENSE', icon: 'Zap', color: '#f59e0b' },
  { id: 'cat-3', name: 'Restaurantes', type: 'EXPENSE', icon: 'Utensils', color: '#ec4899' },
  { id: 'cat-4', name: 'Transporte', type: 'EXPENSE', icon: 'Car', color: '#3b82f6' },
  { id: 'cat-5', name: 'Vivienda', type: 'EXPENSE', icon: 'Home', color: '#6366f1' },
  { id: 'cat-6', name: 'Salud', type: 'EXPENSE', icon: 'Shield', color: '#f43f5e' },
  { id: 'cat-7', name: 'Salario / Ingresos', type: 'INCOME', icon: 'Wallet', color: '#10b981' },
];

export function useCategories(type?: 'INCOME' | 'EXPENSE') {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isValidUuid = activeWorkspaceId && /^[0-9a-fA-F-]{36}$/.test(activeWorkspaceId);

  return useQuery<CategoryDTO[]>({
    queryKey: ['categories', activeWorkspaceId, type, isAuthenticated],
    queryFn: () => {
      if (!isAuthenticated) {
        return type ? DEFAULT_DEMO_CATEGORIES.filter((c) => c.type === type) : DEFAULT_DEMO_CATEGORIES;
      }
      return getCategories(activeWorkspaceId!, type);
    },
    enabled: (!isAuthenticated) || Boolean(isValidUuid),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) => createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
