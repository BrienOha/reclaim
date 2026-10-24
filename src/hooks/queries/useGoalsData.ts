import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/useAuth';
import {
  GoalsService,
  Goal,
  GoalInsert,
  GoalUpdate,
  Milestone,
  MilestoneInsert,
  MilestoneUpdate,
} from '@/services/goals.service';
import { generateUUID } from '@/utils/uuid';

export const GOALS_QUERY_KEYS = {
  goals: (userId: string) => ['goals', userId] as const,
  milestones: (userId: string, goalId?: string) => ['milestones', userId, goalId || 'all'] as const,
};

export function useGoalsData() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id || '';

  const goalsQuery = useQuery({
    queryKey: GOALS_QUERY_KEYS.goals(userId),
    queryFn: () => GoalsService.getGoals(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 3,
  });

  const milestonesQuery = useQuery({
    queryKey: GOALS_QUERY_KEYS.milestones(userId),
    queryFn: () => GoalsService.getMilestones(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 3,
  });

  const createGoalMutation = useMutation({
    mutationFn: async ({
      goal,
      milestoneTitles,
    }: {
      goal: Omit<GoalInsert, 'user_id'>;
      milestoneTitles: string[];
    }) => {
      const goalId = goal.id || generateUUID();
      const createdGoal = await GoalsService.createGoal({
        ...goal,
        id: goalId,
        user_id: userId,
      });

      if (milestoneTitles.length > 0) {
        const milestonesToCreate: MilestoneInsert[] = milestoneTitles.map((title, idx) => ({
          id: generateUUID(),
          goal_id: goalId,
          user_id: userId,
          title,
          is_completed: false,
          position: idx,
        }));
        await GoalsService.createMilestones(milestonesToCreate);
      }

      return createdGoal;
    },
    onMutate: async ({ goal }) => {
      await queryClient.cancelQueries({ queryKey: GOALS_QUERY_KEYS.goals(userId) });
      const previous = queryClient.getQueryData<Goal[]>(GOALS_QUERY_KEYS.goals(userId)) || [];

      const optimistic: Goal = {
        id: goal.id || generateUUID(),
        user_id: userId,
        tier: goal.tier,
        title: goal.title,
        description: goal.description || null,
        category: goal.category || 'Creative',
        target_date: goal.target_date || null,
        cover_image_url: goal.cover_image_url || null,
        is_pinned_of_week: goal.is_pinned_of_week || false,
        is_archived: false,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData(GOALS_QUERY_KEYS.goals(userId), [optimistic, ...previous]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(GOALS_QUERY_KEYS.goals(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEYS.goals(userId) });
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEYS.milestones(userId) });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ goalId, updates }: { goalId: string; updates: GoalUpdate }) =>
      GoalsService.updateGoal(goalId, updates),
    onMutate: async ({ goalId, updates }) => {
      await queryClient.cancelQueries({ queryKey: GOALS_QUERY_KEYS.goals(userId) });
      const previous = queryClient.getQueryData<Goal[]>(GOALS_QUERY_KEYS.goals(userId)) || [];

      queryClient.setQueryData(
        GOALS_QUERY_KEYS.goals(userId),
        previous.map((g) => (g.id === goalId ? { ...g, ...updates, updated_at: new Date().toISOString() } : g))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(GOALS_QUERY_KEYS.goals(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEYS.goals(userId) });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => GoalsService.deleteGoal(goalId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEYS.goals(userId) });
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEYS.milestones(userId) });
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ milestoneId, updates }: { milestoneId: string; updates: MilestoneUpdate }) =>
      GoalsService.updateMilestone(milestoneId, updates),
    onMutate: async ({ milestoneId, updates }) => {
      await queryClient.cancelQueries({ queryKey: GOALS_QUERY_KEYS.milestones(userId) });
      const previous = queryClient.getQueryData<Milestone[]>(GOALS_QUERY_KEYS.milestones(userId)) || [];

      queryClient.setQueryData(
        GOALS_QUERY_KEYS.milestones(userId),
        previous.map((m) => (m.id === milestoneId ? { ...m, ...updates } : m))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(GOALS_QUERY_KEYS.milestones(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEYS.milestones(userId) });
    },
  });

  return {
    goals: goalsQuery.data || [],
    milestones: milestonesQuery.data || [],
    isLoading: goalsQuery.isLoading || milestonesQuery.isLoading,
    createGoal: createGoalMutation.mutateAsync,
    updateGoal: updateGoalMutation.mutateAsync,
    deleteGoal: deleteGoalMutation.mutateAsync,
    updateMilestone: updateMilestoneMutation.mutateAsync,
    isMutating:
      createGoalMutation.isPending || updateGoalMutation.isPending || updateMilestoneMutation.isPending,
  };
}
