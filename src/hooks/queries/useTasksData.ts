import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/useAuth';
import { TasksService, Task, TaskInsert, TaskUpdate } from '@/services/tasks.service';
import { generateUUID } from '@/utils/uuid';

export const TASK_QUERY_KEYS = {
  all: (userId: string) => ['tasks', userId] as const,
  lists: (userId: string) => ['task-lists', userId] as const,
};

export function useTasksData() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id || '';

  const tasksQuery = useQuery({
    queryKey: TASK_QUERY_KEYS.all(userId),
    queryFn: () => TasksService.getTasks(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 3, // 3 mins
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData: Omit<TaskInsert, 'user_id'>) =>
      TasksService.createTask({
        ...taskData,
        id: taskData.id || generateUUID(),
        user_id: userId,
      }),
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: TASK_QUERY_KEYS.all(userId) });
      const previousTasks = queryClient.getQueryData<Task[]>(TASK_QUERY_KEYS.all(userId)) || [];

      const optimisticTask: Task = {
        id: newTask.id || generateUUID(),
        user_id: userId,
        list_id: newTask.list_id || null,
        goal_id: newTask.goal_id || null,
        title: newTask.title,
        notes: newTask.notes || null,
        deadline: newTask.deadline || null,
        priority: newTask.priority || 'medium',
        tags: newTask.tags || [],
        subtasks: (newTask.subtasks as any) || [],
        is_completed: newTask.is_completed || false,
        completed_at: newTask.completed_at || null,
        is_recurring: newTask.is_recurring || false,
        recurrence_rule: newTask.recurrence_rule || null,
        position: newTask.position || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Task[]>(TASK_QUERY_KEYS.all(userId), [optimisticTask, ...previousTasks]);
      return { previousTasks };
    },
    onError: (_err, _newTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASK_QUERY_KEYS.all(userId), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all(userId) });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: TaskUpdate }) =>
      TasksService.updateTask(taskId, updates),
    onMutate: async ({ taskId, updates }) => {
      await queryClient.cancelQueries({ queryKey: TASK_QUERY_KEYS.all(userId) });
      const previousTasks = queryClient.getQueryData<Task[]>(TASK_QUERY_KEYS.all(userId)) || [];

      queryClient.setQueryData<Task[]>(
        TASK_QUERY_KEYS.all(userId),
        previousTasks.map((t) => (t.id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t))
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASK_QUERY_KEYS.all(userId), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all(userId) });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => TasksService.deleteTask(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: TASK_QUERY_KEYS.all(userId) });
      const previousTasks = queryClient.getQueryData<Task[]>(TASK_QUERY_KEYS.all(userId)) || [];

      queryClient.setQueryData<Task[]>(
        TASK_QUERY_KEYS.all(userId),
        previousTasks.filter((t) => t.id !== taskId)
      );

      return { previousTasks };
    },
    onError: (_err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASK_QUERY_KEYS.all(userId), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all(userId) });
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    isError: tasksQuery.isError,
    error: tasksQuery.error,
    refetch: tasksQuery.refetch,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    isMutating:
      createTaskMutation.isPending || updateTaskMutation.isPending || deleteTaskMutation.isPending,
  };
}
