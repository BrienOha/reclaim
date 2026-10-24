import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { useToastStore } from '@/store/useToastStore';

export type Streak = Database['public']['Tables']['streaks']['Row'];
export type StreakInsert = Database['public']['Tables']['streaks']['Insert'];
export type StreakUpdate = Database['public']['Tables']['streaks']['Update'];
export type StreakLog = Database['public']['Tables']['streak_logs']['Row'];
export type StreakLogInsert = Database['public']['Tables']['streak_logs']['Insert'];
export type DailyCheckin = Database['public']['Tables']['daily_checkins']['Row'];
export type DailyCheckinInsert = Database['public']['Tables']['daily_checkins']['Insert'];

export const StreaksService = {
  async getStreaks(userId: string): Promise<Streak[]> {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Supabase Query Error] getStreaks:', error.message);
      useToastStore.getState().showError(`Failed to load streaks: ${error.message}`);
      throw error;
    }

    return (data || []) as Streak[];
  },

  async createStreak(streak: StreakInsert): Promise<Streak> {
    useToastStore.getState().showSaving('Saving habit streak to Supabase...');
    console.log('[Supabase Mutation] createStreak:', streak);

    const { data, error } = await supabase
      .from('streaks')
      .insert(streak)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Mutation Error] createStreak:', error.message);
      useToastStore.getState().showError(`Could not save streak: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] createStreak:', data);
    useToastStore.getState().showSuccess('Streak created ✓');
    return data as Streak;
  },

  async updateStreak(streakId: string, updates: StreakUpdate): Promise<Streak> {
    console.log(`[Supabase Mutation] updateStreak ${streakId}:`, updates);

    const { data, error } = await supabase
      .from('streaks')
      .update(updates)
      .eq('id', streakId)
      .select()
      .single();

    if (error) {
      console.error(`[Supabase Mutation Error] updateStreak ${streakId}:`, error.message);
      useToastStore.getState().showError(`Could not update streak: ${error.message}`);
      throw error;
    }

    useToastStore.getState().showSuccess('Streak updated ✓');
    return data as Streak;
  },

  async deleteStreak(streakId: string): Promise<void> {
    const { error } = await supabase
      .from('streaks')
      .delete()
      .eq('id', streakId);

    if (error) {
      console.error(`[Supabase Mutation Error] deleteStreak ${streakId}:`, error.message);
      throw error;
    }
  },

  async getStreakLogs(userId: string, streakId?: string): Promise<StreakLog[]> {
    let query = supabase
      .from('streak_logs')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false });

    if (streakId) {
      query = query.eq('streak_id', streakId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[Supabase Query Error] getStreakLogs:', error.message);
      throw error;
    }

    return (data || []) as StreakLog[];
  },

  async createStreakLog(log: StreakLogInsert): Promise<StreakLog> {
    useToastStore.getState().showSaving('Logging urge session to Supabase...');
    console.log('[Supabase Mutation] createStreakLog:', log);

    const { data, error } = await supabase
      .from('streak_logs')
      .insert(log)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Mutation Error] createStreakLog:', error.message);
      useToastStore.getState().showError(`Could not log urge outcome: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] createStreakLog:', data);
    useToastStore.getState().showSuccess('Outcome recorded ✓');
    return data as StreakLog;
  },

  async getTodayCheckin(userId: string, dateStr: string): Promise<DailyCheckin | null> {
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('checkin_date', dateStr)
      .maybeSingle();

    if (error) {
      console.error('[Supabase Query Error] getTodayCheckin:', error.message);
      throw error;
    }

    return (data || null) as DailyCheckin | null;
  },

  async upsertDailyCheckin(checkin: DailyCheckinInsert): Promise<DailyCheckin> {
    console.log('[Supabase Mutation] upsertDailyCheckin:', checkin);

    const { data, error } = await supabase
      .from('daily_checkins')
      .upsert(checkin, { onConflict: 'user_id,checkin_date' })
      .select()
      .single();

    if (error) {
      console.error('[Supabase Mutation Error] upsertDailyCheckin:', error.message);
      useToastStore.getState().showError(`Could not save checkin: ${error.message}`);
      throw error;
    }

    useToastStore.getState().showSuccess('Mood check-in saved ✓');
    return data as DailyCheckin;
  },
};
