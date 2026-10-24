import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { useToastStore } from '@/store/useToastStore';

export type Goal = Database['public']['Tables']['goals']['Row'];
export type GoalInsert = Database['public']['Tables']['goals']['Insert'];
export type GoalUpdate = Database['public']['Tables']['goals']['Update'];
export type Milestone = Database['public']['Tables']['goal_milestones']['Row'];
export type MilestoneInsert = Database['public']['Tables']['goal_milestones']['Insert'];
export type MilestoneUpdate = Database['public']['Tables']['goal_milestones']['Update'];

export const GoalsService = {
  async getGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Query Error] getGoals:', error.message);
      useToastStore.getState().showError(`Failed to load goals: ${error.message}`);
      throw error;
    }

    return (data || []) as Goal[];
  },

  async createGoal(goal: GoalInsert): Promise<Goal> {
    useToastStore.getState().showSaving('Saving goal to Supabase...');
    console.log('[Supabase Mutation] createGoal:', goal);

    const { data, error } = await supabase
      .from('goals')
      .insert(goal)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Mutation Error] createGoal:', error.message);
      useToastStore.getState().showError(`Could not save goal: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] createGoal:', data);
    useToastStore.getState().showSuccess('Goal created ✓');
    return data as Goal;
  },

  async updateGoal(goalId: string, updates: GoalUpdate): Promise<Goal> {
    useToastStore.getState().showSaving('Updating goal...');
    console.log(`[Supabase Mutation] updateGoal ${goalId}:`, updates);

    const { data, error } = await supabase
      .from('goals')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .select()
      .single();

    if (error) {
      console.error(`[Supabase Mutation Error] updateGoal ${goalId}:`, error.message);
      useToastStore.getState().showError(`Could not update goal: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] updateGoal:', data);
    useToastStore.getState().showSuccess('Goal updated ✓');
    return data as Goal;
  },

  async deleteGoal(goalId: string): Promise<void> {
    useToastStore.getState().showSaving('Deleting goal...');
    console.log(`[Supabase Mutation] deleteGoal ${goalId}`);

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      console.error(`[Supabase Mutation Error] deleteGoal ${goalId}:`, error.message);
      useToastStore.getState().showError(`Could not delete goal: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] deleteGoal completed');
    useToastStore.getState().showSuccess('Goal deleted ✓');
  },

  async getMilestones(userId: string, goalId?: string): Promise<Milestone[]> {
    let query = supabase
      .from('goal_milestones')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (goalId) {
      query = query.eq('goal_id', goalId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[Supabase Query Error] getMilestones:', error.message);
      throw error;
    }

    return (data || []) as Milestone[];
  },

  async createMilestones(milestones: MilestoneInsert[]): Promise<Milestone[]> {
    if (milestones.length === 0) return [];
    console.log('[Supabase Mutation] createMilestones:', milestones);

    const { data, error } = await supabase
      .from('goal_milestones')
      .insert(milestones)
      .select();

    if (error) {
      console.error('[Supabase Mutation Error] createMilestones:', error.message);
      useToastStore.getState().showError(`Could not save milestones: ${error.message}`);
      throw error;
    }

    return (data || []) as Milestone[];
  },

  async updateMilestone(milestoneId: string, updates: MilestoneUpdate): Promise<Milestone> {
    console.log(`[Supabase Mutation] updateMilestone ${milestoneId}:`, updates);

    const { data, error } = await supabase
      .from('goal_milestones')
      .update(updates)
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) {
      console.error(`[Supabase Mutation Error] updateMilestone ${milestoneId}:`, error.message);
      useToastStore.getState().showError(`Could not update milestone: ${error.message}`);
      throw error;
    }

    return data as Milestone;
  },

  async deleteMilestone(milestoneId: string): Promise<void> {
    const { error } = await supabase
      .from('goal_milestones')
      .delete()
      .eq('id', milestoneId);

    if (error) {
      console.error(`[Supabase Mutation Error] deleteMilestone ${milestoneId}:`, error.message);
      throw error;
    }
  },
};
