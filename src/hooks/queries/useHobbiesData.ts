import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/useAuth';
import { HobbiesService, Hobby, HobbyInsert, HobbyUpdate, HobbySessionInsert } from '@/services/hobbies.service';
import { generateUUID } from '@/utils/uuid';

export const HOBBY_QUERY_KEYS = {
  all: (userId: string) => ['hobbies', userId] as const,
  sessions: (userId: string, hobbyId?: string) => ['hobby-sessions', userId, hobbyId || 'all'] as const,
};

export function useHobbiesData() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id || '';

  const hobbiesQuery = useQuery({
    queryKey: HOBBY_QUERY_KEYS.all(userId),
    queryFn: () => HobbiesService.getHobbies(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 3,
  });

  const createHobbyMutation = useMutation({
    mutationFn: (hobbyData: Omit<HobbyInsert, 'user_id'>) =>
      HobbiesService.createHobby({
        ...hobbyData,
        id: hobbyData.id || generateUUID(),
        user_id: userId,
      }),
    onMutate: async (newHobby) => {
      await queryClient.cancelQueries({ queryKey: HOBBY_QUERY_KEYS.all(userId) });
      const previous = queryClient.getQueryData<Hobby[]>(HOBBY_QUERY_KEYS.all(userId)) || [];

      const optimistic: Hobby = {
        id: newHobby.id || generateUUID(),
        user_id: userId,
        title: newHobby.title,
        description: newHobby.description || null,
        icon: newHobby.icon || 'brush',
        color: newHobby.color || '#FFE600',
        mini_projects: newHobby.mini_projects || [],
        creative_challenges: newHobby.creative_challenges || [],
        total_minutes_logged: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Hobby[]>(HOBBY_QUERY_KEYS.all(userId), [...previous, optimistic]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(HOBBY_QUERY_KEYS.all(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HOBBY_QUERY_KEYS.all(userId) });
    },
  });

  const updateHobbyMutation = useMutation({
    mutationFn: ({ hobbyId, updates }: { hobbyId: string; updates: HobbyUpdate }) =>
      HobbiesService.updateHobby(hobbyId, updates),
    onMutate: async ({ hobbyId, updates }) => {
      await queryClient.cancelQueries({ queryKey: HOBBY_QUERY_KEYS.all(userId) });
      const previous = queryClient.getQueryData<Hobby[]>(HOBBY_QUERY_KEYS.all(userId)) || [];

      queryClient.setQueryData<Hobby[]>(
        HOBBY_QUERY_KEYS.all(userId),
        previous.map((h) => (h.id === hobbyId ? { ...h, ...updates } : h))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(HOBBY_QUERY_KEYS.all(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HOBBY_QUERY_KEYS.all(userId) });
    },
  });

  const deleteHobbyMutation = useMutation({
    mutationFn: (hobbyId: string) => HobbiesService.deleteHobby(hobbyId),
    onMutate: async (hobbyId) => {
      await queryClient.cancelQueries({ queryKey: HOBBY_QUERY_KEYS.all(userId) });
      const previous = queryClient.getQueryData<Hobby[]>(HOBBY_QUERY_KEYS.all(userId)) || [];

      queryClient.setQueryData<Hobby[]>(
        HOBBY_QUERY_KEYS.all(userId),
        previous.filter((h) => h.id !== hobbyId)
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(HOBBY_QUERY_KEYS.all(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HOBBY_QUERY_KEYS.all(userId) });
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: (session: Omit<HobbySessionInsert, 'user_id'>) =>
      HobbiesService.createHobbySession({
        ...session,
        id: session.id || generateUUID(),
        user_id: userId,
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HOBBY_QUERY_KEYS.all(userId) });
      queryClient.invalidateQueries({ queryKey: ['hobby-sessions', userId] });
    },
  });

  return {
    hobbies: hobbiesQuery.data || [],
    isLoading: hobbiesQuery.isLoading,
    isError: hobbiesQuery.isError,
    error: hobbiesQuery.error,
    refetch: hobbiesQuery.refetch,
    createHobby: createHobbyMutation.mutateAsync,
    updateHobby: updateHobbyMutation.mutateAsync,
    deleteHobby: deleteHobbyMutation.mutateAsync,
    createSession: createSessionMutation.mutateAsync,
    isMutating:
      createHobbyMutation.isPending ||
      updateHobbyMutation.isPending ||
      deleteHobbyMutation.isPending ||
      createSessionMutation.isPending,
  };
}
