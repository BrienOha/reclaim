import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/useAuth';
import {
  FinanceService,
  FinanceWeek,
  FinanceWeekInsert,
  Expense,
  ExpenseInsert,
  WishlistItem,
  WishlistItemInsert,
  WishlistItemUpdate,
} from '@/services/finance.service';
import { generateUUID } from '@/utils/uuid';

export const FINANCE_QUERY_KEYS = {
  week: (userId: string, weekDate: string) => ['finance-week', userId, weekDate] as const,
  expenses: (userId: string, weekId?: string) => ['expenses', userId, weekId || 'all'] as const,
  wishlist: (userId: string) => ['wishlist', userId] as const,
};

export function useFinanceData(currentWeekStartDate: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id || '';

  const weekQuery = useQuery({
    queryKey: FINANCE_QUERY_KEYS.week(userId, currentWeekStartDate),
    queryFn: () => FinanceService.getFinanceWeek(userId, currentWeekStartDate),
    enabled: Boolean(userId && currentWeekStartDate),
    staleTime: 1000 * 60 * 3,
  });

  const expensesQuery = useQuery({
    queryKey: FINANCE_QUERY_KEYS.expenses(userId),
    queryFn: () => FinanceService.getExpenses(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 3,
  });

  const wishlistQuery = useQuery({
    queryKey: FINANCE_QUERY_KEYS.wishlist(userId),
    queryFn: () => FinanceService.getWishlist(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 3,
  });

  const saveBudgetMutation = useMutation({
    mutationFn: (weekData: Omit<FinanceWeekInsert, 'user_id' | 'week_start_date'>) =>
      FinanceService.upsertFinanceWeek({
        ...weekData,
        id: weekData.id || generateUUID(),
        user_id: userId,
        week_start_date: currentWeekStartDate,
      }),
    onMutate: async (newBudget) => {
      await queryClient.cancelQueries({ queryKey: FINANCE_QUERY_KEYS.week(userId, currentWeekStartDate) });
      const previous = queryClient.getQueryData<FinanceWeek | null>(
        FINANCE_QUERY_KEYS.week(userId, currentWeekStartDate)
      );

      const optimistic: FinanceWeek = {
        id: newBudget.id || generateUUID(),
        user_id: userId,
        week_start_date: currentWeekStartDate,
        allowance_amount: newBudget.allowance_amount || 0,
        savings_allocation: newBudget.savings_allocation || 0,
        currency: newBudget.currency || 'PHP',
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(FINANCE_QUERY_KEYS.week(userId, currentWeekStartDate), optimistic);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FINANCE_QUERY_KEYS.week(userId, currentWeekStartDate), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.week(userId, currentWeekStartDate) });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (expenseData: Omit<ExpenseInsert, 'user_id' | 'week_id'> & { week_id?: string }) => {
      let weekId = expenseData.week_id;
      if (!weekId) {
        const existingWeek = await FinanceService.getFinanceWeek(userId, currentWeekStartDate);
        if (existingWeek) {
          weekId = existingWeek.id;
        } else {
          const createdWeek = await FinanceService.upsertFinanceWeek({
            user_id: userId,
            week_start_date: currentWeekStartDate,
            allowance_amount: 0,
            savings_allocation: 0,
            currency: 'PHP',
          });
          weekId = createdWeek.id;
        }
      }

      return FinanceService.createExpense({
        ...expenseData,
        id: expenseData.id || generateUUID(),
        user_id: userId,
        week_id: weekId,
      });
    },
    onMutate: async (newExp) => {
      await queryClient.cancelQueries({ queryKey: FINANCE_QUERY_KEYS.expenses(userId) });
      const previous = queryClient.getQueryData<Expense[]>(FINANCE_QUERY_KEYS.expenses(userId)) || [];

      const optimistic: Expense = {
        id: newExp.id || generateUUID(),
        user_id: userId,
        week_id: newExp.week_id || 'pending',
        expense_date: newExp.expense_date || new Date().toISOString().split('T')[0],
        amount: newExp.amount,
        category: newExp.category,
        note: newExp.note || null,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(FINANCE_QUERY_KEYS.expenses(userId), [optimistic, ...previous]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FINANCE_QUERY_KEYS.expenses(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.expenses(userId) });
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.week(userId, currentWeekStartDate) });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId: string) => FinanceService.deleteExpense(expenseId),
    onMutate: async (expenseId) => {
      await queryClient.cancelQueries({ queryKey: FINANCE_QUERY_KEYS.expenses(userId) });
      const previous = queryClient.getQueryData<Expense[]>(FINANCE_QUERY_KEYS.expenses(userId)) || [];

      queryClient.setQueryData(
        FINANCE_QUERY_KEYS.expenses(userId),
        previous.filter((e) => e.id !== expenseId)
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FINANCE_QUERY_KEYS.expenses(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.expenses(userId) });
    },
  });

  const createWishlistMutation = useMutation({
    mutationFn: (item: Omit<WishlistItemInsert, 'user_id'>) =>
      FinanceService.createWishlistItem({
        ...item,
        id: item.id || generateUUID(),
        user_id: userId,
      }),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: FINANCE_QUERY_KEYS.wishlist(userId) });
      const previous = queryClient.getQueryData<WishlistItem[]>(FINANCE_QUERY_KEYS.wishlist(userId)) || [];

      const optimistic: WishlistItem = {
        id: newItem.id || generateUUID(),
        user_id: userId,
        item_name: newItem.item_name,
        price: newItem.price,
        image_url: newItem.image_url || null,
        link_url: newItem.link_url || null,
        priority: newItem.priority || 'medium',
        is_bought: false,
        bought_at: null,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(FINANCE_QUERY_KEYS.wishlist(userId), [optimistic, ...previous]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FINANCE_QUERY_KEYS.wishlist(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.wishlist(userId) });
    },
  });

  const updateWishlistMutation = useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: WishlistItemUpdate }) =>
      FinanceService.updateWishlistItem(itemId, updates),
    onMutate: async ({ itemId, updates }) => {
      await queryClient.cancelQueries({ queryKey: FINANCE_QUERY_KEYS.wishlist(userId) });
      const previous = queryClient.getQueryData<WishlistItem[]>(FINANCE_QUERY_KEYS.wishlist(userId)) || [];

      queryClient.setQueryData(
        FINANCE_QUERY_KEYS.wishlist(userId),
        previous.map((w) => (w.id === itemId ? { ...w, ...updates } : w))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FINANCE_QUERY_KEYS.wishlist(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.wishlist(userId) });
    },
  });

  const deleteWishlistMutation = useMutation({
    mutationFn: (itemId: string) => FinanceService.deleteWishlistItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: FINANCE_QUERY_KEYS.wishlist(userId) });
      const previous = queryClient.getQueryData<WishlistItem[]>(FINANCE_QUERY_KEYS.wishlist(userId)) || [];

      queryClient.setQueryData(
        FINANCE_QUERY_KEYS.wishlist(userId),
        previous.filter((w) => w.id !== itemId)
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FINANCE_QUERY_KEYS.wishlist(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEYS.wishlist(userId) });
    },
  });

  return {
    weekData: weekQuery.data || null,
    expenses: expensesQuery.data || [],
    wishlist: wishlistQuery.data || [],
    isLoading: weekQuery.isLoading || expensesQuery.isLoading || wishlistQuery.isLoading,
    saveBudget: saveBudgetMutation.mutateAsync,
    createExpense: createExpenseMutation.mutateAsync,
    deleteExpense: deleteExpenseMutation.mutateAsync,
    createWishlistItem: createWishlistMutation.mutateAsync,
    updateWishlistItem: updateWishlistMutation.mutateAsync,
    deleteWishlistItem: deleteWishlistMutation.mutateAsync,
    isMutating:
      saveBudgetMutation.isPending ||
      createExpenseMutation.isPending ||
      createWishlistMutation.isPending ||
      updateWishlistMutation.isPending,
  };
}
