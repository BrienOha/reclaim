import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/useAuth';
import {
  StreaksService,
  Streak,
  StreakInsert,
  StreakUpdate,
  StreakLogInsert,
  DailyCheckin,
  DailyCheckinInsert,
} from '@/services/streaks.service';
import { generateUUID } from '@/utils/uuid';

export const STREAKS_QUERY_KEYS = {
  streaks: (userId: string) => ['streaks', userId] as const,
  logs: (userId: string, streakId?: string) => ['streak-logs', userId, streakId || 'all'] as const,
  checkin: (userId: string, dateStr: string) => ['daily-checkin', userId, dateStr] as const,
};

export function useStreaksData() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id || '';
  const todayStr = new Date().toISOString().split('T')[0];

  const streaksQuery = useQuery({
    queryKey: STREAKS_QUERY_KEYS.streaks(userId),
    queryFn: () => StreaksService.getStreaks(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 3,
  });

  const checkinQuery = useQuery({
    queryKey: STREAKS_QUERY_KEYS.checkin(userId, todayStr),
    queryFn: () => StreaksService.getTodayCheckin(userId, todayStr),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });

  const createStreakMutation = useMutation({
    mutationFn: (streak: Omit<StreakInsert, 'user_id'>) =>
      StreaksService.createStreak({
        ...streak,
        id: streak.id || generateUUID(),
        user_id: userId,
      }),
    onMutate: async (newStreak) => {
      await queryClient.cancelQueries({ queryKey: STREAKS_QUERY_KEYS.streaks(userId) });
      const previous = queryClient.getQueryData<Streak[]>(STREAKS_QUERY_KEYS.streaks(userId)) || [];

      const optimistic: Streak = {
        id: newStreak.id || generateUUID(),
        user_id: userId,
        habit_name: newStreak.habit_name,
        category: newStreak.category || 'Digital',
        started_at: newStreak.started_at || new Date().toISOString(),
        longest_streak_days: newStreak.longest_streak_days || 0,
        icon: newStreak.icon || 'shield',
        accent_color: newStreak.accent_color || '#FF5388',
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(STREAKS_QUERY_KEYS.streaks(userId), [...previous, optimistic]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(STREAKS_QUERY_KEYS.streaks(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STREAKS_QUERY_KEYS.streaks(userId) });
    },
  });

  const updateStreakMutation = useMutation({
    mutationFn: ({ streakId, updates }: { streakId: string; updates: StreakUpdate }) =>
      StreaksService.updateStreak(streakId, updates),
    onMutate: async ({ streakId, updates }) => {
      await queryClient.cancelQueries({ queryKey: STREAKS_QUERY_KEYS.streaks(userId) });
      const previous = queryClient.getQueryData<Streak[]>(STREAKS_QUERY_KEYS.streaks(userId)) || [];

      queryClient.setQueryData(
        STREAKS_QUERY_KEYS.streaks(userId),
        previous.map((s) => (s.id === streakId ? { ...s, ...updates } : s))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(STREAKS_QUERY_KEYS.streaks(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STREAKS_QUERY_KEYS.streaks(userId) });
    },
  });

  const createLogMutation = useMutation({
    mutationFn: (log: Omit<StreakLogInsert, 'user_id'>) =>
      StreaksService.createStreakLog({
        ...log,
        id: log.id || generateUUID(),
        user_id: userId,
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['streak-logs', userId] });
      queryClient.invalidateQueries({ queryKey: STREAKS_QUERY_KEYS.streaks(userId) });
    },
  });

  const upsertCheckinMutation = useMutation({
    mutationFn: (checkin: Omit<DailyCheckinInsert, 'user_id'>) =>
      StreaksService.upsertDailyCheckin({
        ...checkin,
        id: checkin.id || generateUUID(),
        user_id: userId,
        checkin_date: todayStr,
      }),
    onMutate: async (newCheckin) => {
      await queryClient.cancelQueries({ queryKey: STREAKS_QUERY_KEYS.checkin(userId, todayStr) });
      const previous = queryClient.getQueryData<DailyCheckin | null>(
        STREAKS_QUERY_KEYS.checkin(userId, todayStr)
      );

      const optimistic: DailyCheckin = {
        id: newCheckin.id || generateUUID(),
        user_id: userId,
        checkin_date: todayStr,
        mood: newCheckin.mood,
        journal_note: newCheckin.journal_note || null,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(STREAKS_QUERY_KEYS.checkin(userId, todayStr), optimistic);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(STREAKS_QUERY_KEYS.checkin(userId, todayStr), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STREAKS_QUERY_KEYS.checkin(userId, todayStr) });
    },
  });

  return {
    streaks: streaksQuery.data || [],
    checkin: checkinQuery.data || null,
    isLoading: streaksQuery.isLoading || checkinQuery.isLoading,
    createStreak: createStreakMutation.mutateAsync,
    updateStreak: updateStreakMutation.mutateAsync,
    createStreakLog: createLogMutation.mutateAsync,
    upsertCheckin: upsertCheckinMutation.mutateAsync,
    isMutating:
      createStreakMutation.isPending ||
      updateStreakMutation.isPending ||
      createLogMutation.isPending ||
      upsertCheckinMutation.isPending,
  };
}
