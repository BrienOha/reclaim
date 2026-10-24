import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { useToastStore } from '@/store/useToastStore';

export type FinanceWeek = Database['public']['Tables']['finance_weeks']['Row'];
export type FinanceWeekInsert = Database['public']['Tables']['finance_weeks']['Insert'];
export type Expense = Database['public']['Tables']['finance_expenses']['Row'];
export type ExpenseInsert = Database['public']['Tables']['finance_expenses']['Insert'];
export type WishlistItem = Database['public']['Tables']['finance_wishlist']['Row'];
export type WishlistItemInsert = Database['public']['Tables']['finance_wishlist']['Insert'];
export type WishlistItemUpdate = Database['public']['Tables']['finance_wishlist']['Update'];

export const FinanceService = {
  async getFinanceWeek(userId: string, weekStartDate: string): Promise<FinanceWeek | null> {
    const { data, error } = await supabase
      .from('finance_weeks')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .maybeSingle();

    if (error) {
      console.error('[Supabase Query Error] getFinanceWeek:', error.message);
      useToastStore.getState().showError(`Failed to load weekly budget: ${error.message}`);
      throw error;
    }

    return (data || null) as FinanceWeek | null;
  },

  async upsertFinanceWeek(week: FinanceWeekInsert): Promise<FinanceWeek> {
    useToastStore.getState().showSaving('Saving budget to Supabase...');
    console.log('[Supabase Mutation] upsertFinanceWeek:', week);

    const { data, error } = await supabase
      .from('finance_weeks')
      .upsert(week, { onConflict: 'user_id,week_start_date' })
      .select()
      .single();

    if (error) {
      console.error('[Supabase Mutation Error] upsertFinanceWeek:', error.message);
      useToastStore.getState().showError(`Could not save budget: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] upsertFinanceWeek:', data);
    useToastStore.getState().showSuccess('Budget saved ✓');
    return data as FinanceWeek;
  },

  async getExpenses(userId: string, weekId?: string): Promise<Expense[]> {
    let query = supabase
      .from('finance_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (weekId) {
      query = query.eq('week_id', weekId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[Supabase Query Error] getExpenses:', error.message);
      useToastStore.getState().showError(`Failed to load expenses: ${error.message}`);
      throw error;
    }

    return (data || []) as Expense[];
  },

  async createExpense(expense: ExpenseInsert): Promise<Expense> {
    useToastStore.getState().showSaving('Logging expense in Supabase...');
    console.log('[Supabase Mutation] createExpense:', expense);

    const { data, error } = await supabase
      .from('finance_expenses')
      .insert(expense)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Mutation Error] createExpense:', error.message);
      useToastStore.getState().showError(`Could not log expense: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] createExpense:', data);
    useToastStore.getState().showSuccess('Expense logged ✓');
    return data as Expense;
  },

  async deleteExpense(expenseId: string): Promise<void> {
    useToastStore.getState().showSaving('Deleting expense...');
    console.log(`[Supabase Mutation] deleteExpense ${expenseId}`);

    const { error } = await supabase
      .from('finance_expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      console.error(`[Supabase Mutation Error] deleteExpense ${expenseId}:`, error.message);
      useToastStore.getState().showError(`Could not delete expense: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] deleteExpense completed');
    useToastStore.getState().showSuccess('Expense deleted ✓');
  },

  async getWishlist(userId: string): Promise<WishlistItem[]> {
    const { data, error } = await supabase
      .from('finance_wishlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Query Error] getWishlist:', error.message);
      useToastStore.getState().showError(`Failed to load wishlist: ${error.message}`);
      throw error;
    }

    return (data || []) as WishlistItem[];
  },

  async createWishlistItem(item: WishlistItemInsert): Promise<WishlistItem> {
    useToastStore.getState().showSaving('Adding purchase goal to Supabase...');
    console.log('[Supabase Mutation] createWishlistItem:', item);

    const { data, error } = await supabase
      .from('finance_wishlist')
      .insert(item)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Mutation Error] createWishlistItem:', error.message);
      useToastStore.getState().showError(`Could not add wishlist item: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] createWishlistItem:', data);
    useToastStore.getState().showSuccess('Item added to wishlist ✓');
    return data as WishlistItem;
  },

  async updateWishlistItem(itemId: string, updates: WishlistItemUpdate): Promise<WishlistItem> {
    useToastStore.getState().showSaving('Updating wishlist item...');
    console.log(`[Supabase Mutation] updateWishlistItem ${itemId}:`, updates);

    const { data, error } = await supabase
      .from('finance_wishlist')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error(`[Supabase Mutation Error] updateWishlistItem ${itemId}:`, error.message);
      useToastStore.getState().showError(`Could not update wishlist item: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] updateWishlistItem:', data);
    useToastStore.getState().showSuccess('Wishlist updated ✓');
    return data as WishlistItem;
  },

  async deleteWishlistItem(itemId: string): Promise<void> {
    useToastStore.getState().showSaving('Removing wishlist item...');
    console.log(`[Supabase Mutation] deleteWishlistItem ${itemId}`);

    const { error } = await supabase
      .from('finance_wishlist')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error(`[Supabase Mutation Error] deleteWishlistItem ${itemId}:`, error.message);
      useToastStore.getState().showError(`Could not remove wishlist item: ${error.message}`);
      throw error;
    }

    console.log('[Supabase Mutation Success] deleteWishlistItem completed');
    useToastStore.getState().showSuccess('Item removed ✓');
  },
};
