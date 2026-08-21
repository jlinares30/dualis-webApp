import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateUserProfile, UpdateProfileRequest } from '@/lib/services';
import { useAuthStore } from '@/lib/stores/useAuthStore';

export function useUserProfile() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['userProfile'],
    queryFn: () => getUserProfile(),
    enabled: isAuthenticated,
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateUserProfile(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}
