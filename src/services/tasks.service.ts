import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { useToastStore } from '@/store/useToastStore';

export type Task = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
export type TaskList = Database['public']['Tables']['task_lists']['Row'];

export const TasksService = {
  async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Query Error] getTasks:', error.message);
      useToastStore.getState().showError(`Failed to load tasks: ${error.message}`);
      throw error;
    }

    return (data || []) as Task[];
  },

  async createTask(task: TaskInsert): Promise<Task> {
    useToastStore.getState().showSaving('Saving task to Supabase...');
    console.log('[Supabase Mutation] createTask payload:', task);

    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Mutation Error] createTask:', error.message);
      useToastStore.getState().showError(`Could not save task: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] createTask:', data);
    useToastStore.getState().showSuccess('Task saved ✓');
    return data as Task;
  },

  async updateTask(taskId: string, updates: TaskUpdate): Promise<Task> {
    useToastStore.getState().showSaving('Updating task...');
    console.log(`[Supabase Mutation] updateTask ${taskId}:`, updates);

    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error(`[Supabase Mutation Error] updateTask ${taskId}:`, error.message);
      useToastStore.getState().showError(`Could not update task: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] updateTask:', data);
    useToastStore.getState().showSuccess('Task updated ✓');
    return data as Task;
  },

  async deleteTask(taskId: string): Promise<void> {
    useToastStore.getState().showSaving('Deleting task...');
    console.log(`[Supabase Mutation] deleteTask ${taskId}`);

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error(`[Supabase Mutation Error] deleteTask ${taskId}:`, error.message);
      useToastStore.getState().showError(`Could not delete task: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] deleteTask completed');
    useToastStore.getState().showSuccess('Task deleted ✓');
  },

  async getTaskLists(userId: string): Promise<TaskList[]> {
    const { data, error } = await supabase
      .from('task_lists')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) {
      console.error('[Supabase Query Error] getTaskLists:', error.message);
      throw error;
    }

    return (data || []) as TaskList[];
  },
};
