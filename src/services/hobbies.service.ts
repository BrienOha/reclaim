import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { useToastStore } from '@/store/useToastStore';

export type Hobby = Database['public']['Tables']['hobbies']['Row'];
export type HobbyInsert = Database['public']['Tables']['hobbies']['Insert'];
export type HobbyUpdate = Database['public']['Tables']['hobbies']['Update'];
export type HobbySession = Database['public']['Tables']['hobby_sessions']['Row'];
export type HobbySessionInsert = Database['public']['Tables']['hobby_sessions']['Insert'];

export const HobbiesService = {
  async getHobbies(userId: string): Promise<Hobby[]> {
    const { data, error } = await supabase
      .from('hobbies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Supabase Query Error] getHobbies:', error.message);
      useToastStore.getState().showError(`Failed to load hobbies: ${error.message}`);
      throw error;
    }

    return (data || []) as Hobby[];
  },

  async createHobby(hobby: HobbyInsert): Promise<Hobby> {
    useToastStore.getState().showSaving('Saving hobby to Supabase...');
    console.log('[Supabase Mutation] createHobby:', hobby);

    const { data, error } = await supabase
      .from('hobbies')
      .insert(hobby)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Mutation Error] createHobby:', error.message);
      useToastStore.getState().showError(`Could not save hobby: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] createHobby:', data);
    useToastStore.getState().showSuccess('Hobby added ✓');
    return data as Hobby;
  },

  async updateHobby(hobbyId: string, updates: HobbyUpdate): Promise<Hobby> {
    useToastStore.getState().showSaving('Updating hobby...');
    console.log(`[Supabase Mutation] updateHobby ${hobbyId}:`, updates);

    const { data, error } = await supabase
      .from('hobbies')
      .update(updates)
      .eq('id', hobbyId)
      .select()
      .single();

    if (error) {
      console.error(`[Supabase Mutation Error] updateHobby ${hobbyId}:`, error.message);
      useToastStore.getState().showError(`Could not update hobby: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] updateHobby:', data);
    useToastStore.getState().showSuccess('Hobby updated ✓');
    return data as Hobby;
  },

  async deleteHobby(hobbyId: string): Promise<void> {
    useToastStore.getState().showSaving('Deleting hobby...');
    console.log(`[Supabase Mutation] deleteHobby ${hobbyId}`);

    const { error } = await supabase
      .from('hobbies')
      .delete()
      .eq('id', hobbyId);

    if (error) {
      console.error(`[Supabase Mutation Error] deleteHobby ${hobbyId}:`, error.message);
      useToastStore.getState().showError(`Could not delete hobby: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] deleteHobby completed');
    useToastStore.getState().showSuccess('Hobby removed ✓');
  },

  async getHobbySessions(userId: string, hobbyId?: string): Promise<HobbySession[]> {
    let query = supabase
      .from('hobby_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (hobbyId) {
      query = query.eq('hobby_id', hobbyId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[Supabase Query Error] getHobbySessions:', error.message);
      throw error;
    }

    return (data || []) as HobbySession[];
  },

  async createHobbySession(session: HobbySessionInsert): Promise<HobbySession> {
    useToastStore.getState().showSaving('Logging creative session...');
    console.log('[Supabase Mutation] createHobbySession:', session);

    const { data, error } = await supabase
      .from('hobby_sessions')
      .insert(session)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Mutation Error] createHobbySession:', error.message);
      useToastStore.getState().showError(`Could not log session: ${error.message}`);
      throw error;
    }

    // Also increment total_minutes_logged on the hobby
    if (session.duration_minutes > 0) {
      const { data: currentHobby } = await supabase
        .from('hobbies')
        .select('total_minutes_logged')
        .eq('id', session.hobby_id)
        .single();

      if (currentHobby) {
        await supabase
          .from('hobbies')
          .update({
            total_minutes_logged: (currentHobby.total_minutes_logged || 0) + session.duration_minutes,
          })
          .eq('id', session.hobby_id);
      }
    }

    console.log('[Supabase Mutation Success] createHobbySession:', data);
    useToastStore.getState().showSuccess('Session logged ✓');
    return data as HobbySession;
  },
};
