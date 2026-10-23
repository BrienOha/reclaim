import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '@/types/database.types';
import { useAuthStore } from '@/hooks/useAuth';

type Tables = Database['public']['Tables'];

const ENTITY_KEYS = {
  STREAKS: 'streaks',
  STREAK_LOGS: 'streak_logs',
  DAILY_CHECKINS: 'daily_checkins',
  HOBBIES: 'hobbies',
  HOBBY_SESSIONS: 'hobby_sessions',
  TASK_LISTS: 'task_lists',
  TASKS: 'tasks',
  JOURNAL_ENTRIES: 'journal_entries',
  FINANCE_WEEKS: 'finance_weeks',
  FINANCE_EXPENSES: 'finance_expenses',
  FINANCE_WISHLIST: 'finance_wishlist',
  GOALS: 'goals',
  GOAL_MILESTONES: 'goal_milestones',
  ONBOARDING_STATUS: 'onboarding_status',
};

// Preset template recommendations for onboarding (NOT hardcoded database rows)
export const PRESET_HOBBY_TEMPLATES = [
  {
    title: 'Drawing',
    description: 'Digital sketching, character designs, ink illustrations',
    icon: 'brush',
    color: '#FFE600',
    mini_projects: [
      'Draw 10 hands in different gestures',
      'Design a retro arcade cabinet mascot',
      'One-point perspective cyberpunk room',
    ],
    creative_challenges: [
      'Draw a random object on your desk in 60 seconds without lifting your pen',
      'Sketch your current mood as an abstract monster',
    ],
  },
  {
    title: 'Film / Videography',
    description: 'Cinematic b-roll, storytelling, camera movements',
    icon: 'videocam',
    color: '#FF5388',
    mini_projects: [
      'Shoot a 15-second moody morning coffee montage',
      'Experiment with harsh lighting and shadow silhouettes',
    ],
    creative_challenges: [
      'Record 3 cinematic clips in your room using only practical desk lamps',
    ],
  },
  {
    title: 'Editing',
    description: 'Pacing, sound design, rhythmic cuts, color grading',
    icon: 'cut',
    color: '#38B6FF',
    mini_projects: [
      'Edit a punchy 30-sec trailer cut to a heavy beat',
      'Practice foley and whoosh audio layering',
    ],
    creative_challenges: [
      'Re-edit an old phone clip into a fast-paced neo-noir teaser',
    ],
  },
  {
    title: 'Graphic Design',
    description: 'Posters, brutalist layouts, typography experiments',
    icon: 'color-palette',
    color: '#FF7A00',
    mini_projects: [
      'Create a Swiss Bauhaus music festival poster',
      'Design a dystopian futuristic train ticket stub',
    ],
    creative_challenges: [
      'Design an album cover using only 2 colors and 1 chunky font',
    ],
  },
  {
    title: 'Music',
    description: 'Beatmaking, synth chords, basslines, melody building',
    icon: 'musical-notes',
    color: '#B388FF',
    mini_projects: [
      'Craft a crunchy lo-fi hip-hop drum loop',
      'Program a dark 80s synthwave bassline in minor key',
    ],
    creative_challenges: [
      'Cook up a 4-bar progression using a weird retro electric piano',
    ],
  },
];

// Helper to get active user ID
function getActiveUserId(explicitUserId?: string): string {
  if (explicitUserId) return explicitUserId;
  const storeUser = useAuthStore.getState().user;
  return storeUser?.id || 'anonymous';
}

function getUserStorageKey(entity: string, explicitUserId?: string): string {
  const uid = getActiveUserId(explicitUserId);
  return `reclaim_u_${uid}_${entity}`;
}

export async function getLocalItem<T>(key: string, defaultVal: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

export async function setLocalItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export async function removeLocalItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export const OfflineStore = {
  // Hobbies
  getHobbies: (userId?: string) =>
    getLocalItem<Tables['hobbies']['Row'][]>(getUserStorageKey(ENTITY_KEYS.HOBBIES, userId), []),
  saveHobbies: (hobbies: Tables['hobbies']['Row'][], userId?: string) =>
    setLocalItem(getUserStorageKey(ENTITY_KEYS.HOBBIES, userId), hobbies),

  // Streaks
  getStreaks: (userId?: string) =>
    getLocalItem<Tables['streaks']['Row'][]>(getUserStorageKey(ENTITY_KEYS.STREAKS, userId), []),
  saveStreaks: (streaks: Tables['streaks']['Row'][], userId?: string) =>
    setLocalItem(getUserStorageKey(ENTITY_KEYS.STREAKS, userId), streaks),

  // Streak Logs
  getStreakLogs: (userId?: string) =>
    getLocalItem<Tables['streak_logs']['Row'][]>(getUserStorageKey(ENTITY_KEYS.STREAK_LOGS, userId), []),
  saveStreakLogs: (logs: Tables['streak_logs']['Row'][], userId?: string) =>
    setLocalItem(getUserStorageKey(ENTITY_KEYS.STREAK_LOGS, userId), logs),

  // Tasks
  getTasks: (userId?: string) =>
    getLocalItem<Tables['tasks']['Row'][]>(getUserStorageKey(ENTITY_KEYS.TASKS, userId), []),
  saveTasks: (tasks: Tables['tasks']['Row'][], userId?: string) =>
    setLocalItem(getUserStorageKey(ENTITY_KEYS.TASKS, userId), tasks),

  // Journal Entries
  getJournalEntries: (userId?: string) =>
    getLocalItem<Tables['journal_entries']['Row'][]>(getUserStorageKey(ENTITY_KEYS.JOURNAL_ENTRIES, userId), []),
  saveJournalEntries: (entries: Tables['journal_entries']['Row'][], userId?: string) =>
    setLocalItem(getUserStorageKey(ENTITY_KEYS.JOURNAL_ENTRIES, userId), entries),

  // Finance Weeks
  getFinanceWeek: async (weekStartDate: string, userId?: string): Promise<Tables['finance_weeks']['Row']> => {
    const key = getUserStorageKey(ENTITY_KEYS.FINANCE_WEEKS, userId);
    const all = await getLocalItem<Record<string, Tables['finance_weeks']['Row']>>(key, {});
    if (all[weekStartDate]) return all[weekStartDate];

    const uid = getActiveUserId(userId);
    const defaultWeek: Tables['finance_weeks']['Row'] = {
      id: `week-${weekStartDate}-${Date.now()}`,
      user_id: uid,
      week_start_date: weekStartDate,
      allowance_amount: 0,
      savings_allocation: 0,
      currency: 'PHP',
      created_at: new Date().toISOString(),
    };
    all[weekStartDate] = defaultWeek;
    await setLocalItem(key, all);
    return defaultWeek;
  },
  saveFinanceWeek: async (week: Tables['finance_weeks']['Row'], userId?: string) => {
    const key = getUserStorageKey(ENTITY_KEYS.FINANCE_WEEKS, userId);
    const all = await getLocalItem<Record<string, Tables['finance_weeks']['Row']>>(key, {});
    all[week.week_start_date] = week;
    await setLocalItem(key, all);
  },

  // Expenses
  getExpenses: (userId?: string) =>
    getLocalItem<Tables['finance_expenses']['Row'][]>(getUserStorageKey(ENTITY_KEYS.FINANCE_EXPENSES, userId), []),
  saveExpenses: (expenses: Tables['finance_expenses']['Row'][], userId?: string) =>
    setLocalItem(getUserStorageKey(ENTITY_KEYS.FINANCE_EXPENSES, userId), expenses),

  // Wishlist
  getWishlist: (userId?: string) =>
    getLocalItem<Tables['finance_wishlist']['Row'][]>(getUserStorageKey(ENTITY_KEYS.FINANCE_WISHLIST, userId), []),
  saveWishlist: (items: Tables['finance_wishlist']['Row'][], userId?: string) =>
    setLocalItem(getUserStorageKey(ENTITY_KEYS.FINANCE_WISHLIST, userId), items),

  // Goals
  getGoals: (userId?: string) =>
    getLocalItem<Tables['goals']['Row'][]>(getUserStorageKey(ENTITY_KEYS.GOALS, userId), []),
  saveGoals: (goals: Tables['goals']['Row'][], userId?: string) =>
    setLocalItem(getUserStorageKey(ENTITY_KEYS.GOALS, userId), goals),

  // Milestones
  getMilestones: (userId?: string) =>
    getLocalItem<Tables['goal_milestones']['Row'][]>(getUserStorageKey(ENTITY_KEYS.GOAL_MILESTONES, userId), []),
  saveMilestones: (milestones: Tables['goal_milestones']['Row'][], userId?: string) =>
    setLocalItem(getUserStorageKey(ENTITY_KEYS.GOAL_MILESTONES, userId), milestones),

  // Onboarding Status
  hasCompletedOnboarding: async (userId?: string): Promise<boolean> => {
    const key = getUserStorageKey(ENTITY_KEYS.ONBOARDING_STATUS, userId);
    return getLocalItem<boolean>(key, false);
  },
  setOnboardingCompleted: async (completed: boolean, userId?: string): Promise<void> => {
    const key = getUserStorageKey(ENTITY_KEYS.ONBOARDING_STATUS, userId);
    await setLocalItem(key, completed);
  },

  // Clear all local caches for a user
  clearUserLocalData: async (userId: string) => {
    const entities = Object.values(ENTITY_KEYS);
    for (const ent of entities) {
      await removeLocalItem(`reclaim_u_${userId}_${ent}`);
    }
  },
};
