import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { useToastStore } from '@/store/useToastStore';
import { StreakInsert } from './streaks.service';
import { HobbyInsert } from './hobbies.service';
import { FinanceWeekInsert } from './finance.service';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface OnboardingPayload {
  currency: string;
  streaks: Omit<StreakInsert, 'user_id'>[];
  hobbies: Omit<HobbyInsert, 'user_id'>[];
  weeklyBudget?: {
    weekStartDate: string;
    allowance: number;
    savings: number;
  };
}

export const ProfileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Supabase Query Error] getProfile:', error.message);
      throw error;
    }

    return (data || null) as Profile | null;
  },

  async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
    useToastStore.getState().showSaving('Updating profile in Supabase...');
    console.log(`[Supabase Mutation] updateProfile ${userId}:`, updates);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error(`[Supabase Mutation Error] updateProfile ${userId}:`, error.message);
      useToastStore.getState().showError(`Could not update profile: ${error.message}`);
      throw error;
    }

    useToastStore.getState().showSuccess('Profile updated ✓');
    return data as Profile;
  },

  async completeOnboarding(userId: string, payload: OnboardingPayload): Promise<Profile> {
    useToastStore.getState().showSaving('Setting up your clean workspace in Supabase...');
    console.log(`[Supabase Mutation] completeOnboarding for ${userId}:`, payload);

    // 1. Insert initial habits to quit / streaks
    if (payload.streaks.length > 0) {
      const streaksToInsert = payload.streaks.map((s) => ({
        ...s,
        user_id: userId,
      }));
      const { error: streakErr } = await supabase.from('streaks').insert(streaksToInsert);
      if (streakErr) {
        console.error('[Supabase Onboarding Error] streaks insert:', streakErr.message);
        useToastStore.getState().showError(`Failed to save habits: ${streakErr.message}`);
        throw streakErr;
      }
    }

    // 2. Insert initial creative hobbies
    if (payload.hobbies.length > 0) {
      const hobbiesToInsert = payload.hobbies.map((h) => ({
        ...h,
        user_id: userId,
        total_minutes_logged: 0,
        is_active: true,
      }));
      const { error: hobbyErr } = await supabase.from('hobbies').insert(hobbiesToInsert);
      if (hobbyErr) {
        console.error('[Supabase Onboarding Error] hobbies insert:', hobbyErr.message);
        useToastStore.getState().showError(`Failed to save hobbies: ${hobbyErr.message}`);
        throw hobbyErr;
      }
    }

    // 3. Insert initial weekly finance budget if configured
    if (payload.weeklyBudget) {
      const weekInsert: FinanceWeekInsert = {
        user_id: userId,
        week_start_date: payload.weeklyBudget.weekStartDate,
        allowance_amount: payload.weeklyBudget.allowance,
        savings_allocation: payload.weeklyBudget.savings,
        currency: payload.currency,
      };
      const { error: weekErr } = await supabase
        .from('finance_weeks')
        .upsert(weekInsert, { onConflict: 'user_id,week_start_date' });
      if (weekErr) {
        console.error('[Supabase Onboarding Error] finance_weeks insert:', weekErr.message);
      }
    }

    // 4. Update profiles table has_completed_onboarding = true
    const { data: updatedProfile, error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        currency: payload.currency,
        has_completed_onboarding: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileErr) {
      console.error('[Supabase Onboarding Error] profile complete:', profileErr.message);
      useToastStore.getState().showError(`Failed to finish setup: ${profileErr.message}`);
      throw profileErr;
    }

    console.log('[Supabase Onboarding Success] profile completed:', updatedProfile);
    useToastStore.getState().showSuccess('Welcome to Reclaim! ✓');
    return updatedProfile as Profile;
  },
};
