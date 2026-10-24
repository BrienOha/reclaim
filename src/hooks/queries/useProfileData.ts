import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/useAuth';
import { ProfileService, ProfileUpdate, OnboardingPayload } from '@/services/profile.service';

export const PROFILE_QUERY_KEYS = {
  profile: (userId: string) => ['profile', userId] as const,
};

export function useProfileData() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id || '';

  const profileQuery = useQuery({
    queryKey: PROFILE_QUERY_KEYS.profile(userId),
    queryFn: () => ProfileService.getProfile(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (updates: ProfileUpdate) => ProfileService.updateProfile(userId, updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(PROFILE_QUERY_KEYS.profile(userId), updated);
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.profile(userId) });
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: (payload: OnboardingPayload) => ProfileService.completeOnboarding(userId, payload),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEYS.profile(userId), updatedProfile);
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.profile(userId) });
      queryClient.invalidateQueries({ queryKey: ['streaks', userId] });
      queryClient.invalidateQueries({ queryKey: ['hobbies', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-week', userId] });
    },
  });

  return {
    profile: profileQuery.data || null,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    updateProfile: updateProfileMutation.mutateAsync,
    completeOnboarding: completeOnboardingMutation.mutateAsync,
    isMutating: updateProfileMutation.isPending || completeOnboardingMutation.isPending,
  };
}
