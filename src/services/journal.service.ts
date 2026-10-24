import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { useToastStore } from '@/store/useToastStore';

export type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];
export type JournalEntryInsert = Database['public']['Tables']['journal_entries']['Insert'];
export type JournalEntryUpdate = Database['public']['Tables']['journal_entries']['Update'];

export const JournalService = {
  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Query Error] getJournalEntries:', error.message);
      useToastStore.getState().showError(`Failed to load journal entries: ${error.message}`);
      throw error;
    }

    return (data || []) as JournalEntry[];
  },

  async createJournalEntry(entry: JournalEntryInsert): Promise<JournalEntry> {
    useToastStore.getState().showSaving('Saving journal entry to Supabase...');
    console.log('[Supabase Mutation] createJournalEntry:', entry);

    const { data, error } = await supabase
      .from('journal_entries')
      .insert(entry)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Mutation Error] createJournalEntry:', error.message);
      useToastStore.getState().showError(`Could not save journal entry: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] createJournalEntry:', data);
    useToastStore.getState().showSuccess('Journal entry saved ✓');
    return data as JournalEntry;
  },

  async updateJournalEntry(entryId: string, updates: JournalEntryUpdate): Promise<JournalEntry> {
    useToastStore.getState().showSaving('Updating journal entry...');
    console.log(`[Supabase Mutation] updateJournalEntry ${entryId}:`, updates);

    const { data, error } = await supabase
      .from('journal_entries')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      console.error(`[Supabase Mutation Error] updateJournalEntry ${entryId}:`, error.message);
      useToastStore.getState().showError(`Could not update journal entry: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] updateJournalEntry:', data);
    useToastStore.getState().showSuccess('Journal entry updated ✓');
    return data as JournalEntry;
  },

  async deleteJournalEntry(entryId: string): Promise<void> {
    useToastStore.getState().showSaving('Deleting journal entry...');
    console.log(`[Supabase Mutation] deleteJournalEntry ${entryId}`);

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      console.error(`[Supabase Mutation Error] deleteJournalEntry ${entryId}:`, error.message);
      useToastStore.getState().showError(`Could not delete journal entry: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] deleteJournalEntry completed');
    useToastStore.getState().showSuccess('Entry deleted ✓');
  },
};
