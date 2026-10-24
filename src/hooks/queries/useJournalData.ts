import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/useAuth';
import { JournalService, JournalEntry, JournalEntryInsert, JournalEntryUpdate } from '@/services/journal.service';
import { generateUUID } from '@/utils/uuid';

export const JOURNAL_QUERY_KEYS = {
  all: (userId: string) => ['journal', userId] as const,
};

export function useJournalData() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id || '';

  const journalQuery = useQuery({
    queryKey: JOURNAL_QUERY_KEYS.all(userId),
    queryFn: () => JournalService.getJournalEntries(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 3,
  });

  const createEntryMutation = useMutation({
    mutationFn: (entryData: Omit<JournalEntryInsert, 'user_id'>) =>
      JournalService.createJournalEntry({
        ...entryData,
        id: entryData.id || generateUUID(),
        user_id: userId,
      }),
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({ queryKey: JOURNAL_QUERY_KEYS.all(userId) });
      const previous = queryClient.getQueryData<JournalEntry[]>(JOURNAL_QUERY_KEYS.all(userId)) || [];

      const optimistic: JournalEntry = {
        id: newEntry.id || generateUUID(),
        user_id: userId,
        entry_date: newEntry.entry_date || new Date().toISOString().split('T')[0],
        title: newEntry.title,
        body: newEntry.body,
        mood: newEntry.mood ?? 5,
        font_family: newEntry.font_family || 'Space Grotesk',
        canvas_layout: newEntry.canvas_layout || [],
        exported_image_url: newEntry.exported_image_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<JournalEntry[]>(JOURNAL_QUERY_KEYS.all(userId), [optimistic, ...previous]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(JOURNAL_QUERY_KEYS.all(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: JOURNAL_QUERY_KEYS.all(userId) });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({ entryId, updates }: { entryId: string; updates: JournalEntryUpdate }) =>
      JournalService.updateJournalEntry(entryId, updates),
    onMutate: async ({ entryId, updates }) => {
      await queryClient.cancelQueries({ queryKey: JOURNAL_QUERY_KEYS.all(userId) });
      const previous = queryClient.getQueryData<JournalEntry[]>(JOURNAL_QUERY_KEYS.all(userId)) || [];

      queryClient.setQueryData<JournalEntry[]>(
        JOURNAL_QUERY_KEYS.all(userId),
        previous.map((e) => (e.id === entryId ? { ...e, ...updates, updated_at: new Date().toISOString() } : e))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(JOURNAL_QUERY_KEYS.all(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: JOURNAL_QUERY_KEYS.all(userId) });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => JournalService.deleteJournalEntry(entryId),
    onMutate: async (entryId) => {
      await queryClient.cancelQueries({ queryKey: JOURNAL_QUERY_KEYS.all(userId) });
      const previous = queryClient.getQueryData<JournalEntry[]>(JOURNAL_QUERY_KEYS.all(userId)) || [];

      queryClient.setQueryData<JournalEntry[]>(
        JOURNAL_QUERY_KEYS.all(userId),
        previous.filter((e) => e.id !== entryId)
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(JOURNAL_QUERY_KEYS.all(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: JOURNAL_QUERY_KEYS.all(userId) });
    },
  });

  return {
    entries: journalQuery.data || [],
    isLoading: journalQuery.isLoading,
    isError: journalQuery.isError,
    error: journalQuery.error,
    refetch: journalQuery.refetch,
    createEntry: createEntryMutation.mutateAsync,
    updateEntry: updateEntryMutation.mutateAsync,
    deleteEntry: deleteEntryMutation.mutateAsync,
    isMutating:
      createEntryMutation.isPending || updateEntryMutation.isPending || deleteEntryMutation.isPending,
  };
}
