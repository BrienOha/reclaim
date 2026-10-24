-- ==============================================================================
-- RECLAIM APP: PHASE 1 COMPREHENSIVE RLS POLICIES & SCHEMA UPGRADE
-- Keeps RLS ON for all tables and creates explicit, strongly-typed policies
-- for SELECT, INSERT, UPDATE, DELETE with auth.uid() isolation.
-- ==============================================================================

-- 1. Ensure uuid-ossp extension
create extension if not exists "uuid-ossp";

-- 2. Schema enhancements & missing columns check
alter table public.profiles
  add column if not exists has_completed_onboarding boolean not null default false;

alter table public.journal_entries
  add column if not exists is_archived boolean not null default false;

-- 3. Ensure handle_new_user trigger populates profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, has_completed_onboarding)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY: ENABLE ON ALL TABLES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.streaks enable row level security;
alter table public.streak_logs enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.hobbies enable row level security;
alter table public.hobby_sessions enable row level security;
alter table public.task_lists enable row level security;
alter table public.tasks enable row level security;
alter table public.journal_entries enable row level security;
alter table public.finance_weeks enable row level security;
alter table public.finance_expenses enable row level security;
alter table public.finance_wishlist enable row level security;
alter table public.goals enable row level security;
alter table public.goal_milestones enable row level security;

-- ==============================================================================
-- 1. PROFILES POLICIES
-- ==============================================================================
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
drop policy if exists "profiles_self_access" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- ==============================================================================
-- 2. STREAKS POLICIES
-- ==============================================================================
drop policy if exists "streaks_select_own" on public.streaks;
drop policy if exists "streaks_insert_own" on public.streaks;
drop policy if exists "streaks_update_own" on public.streaks;
drop policy if exists "streaks_delete_own" on public.streaks;
drop policy if exists "streaks_user_isolation" on public.streaks;

create policy "streaks_select_own" on public.streaks
  for select using (auth.uid() = user_id);

create policy "streaks_insert_own" on public.streaks
  for insert with check (auth.uid() = user_id);

create policy "streaks_update_own" on public.streaks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "streaks_delete_own" on public.streaks
  for delete using (auth.uid() = user_id);

-- ==============================================================================
-- 3. STREAK LOGS (CHILD TABLE - JOIN CHECK ON PARENT STREAK)
-- ==============================================================================
drop policy if exists "streak_logs_select_own" on public.streak_logs;
drop policy if exists "streak_logs_insert_own" on public.streak_logs;
drop policy if exists "streak_logs_update_own" on public.streak_logs;
drop policy if exists "streak_logs_delete_own" on public.streak_logs;
drop policy if exists "streak_logs_user_isolation" on public.streak_logs;

create policy "streak_logs_select_own" on public.streak_logs
  for select using (
    auth.uid() = user_id and
    exists (select 1 from public.streaks s where s.id = streak_id and s.user_id = auth.uid())
  );

create policy "streak_logs_insert_own" on public.streak_logs
  for insert with check (
    auth.uid() = user_id and
    exists (select 1 from public.streaks s where s.id = streak_id and s.user_id = auth.uid())
  );

create policy "streak_logs_update_own" on public.streak_logs
  for update using (
    auth.uid() = user_id and
    exists (select 1 from public.streaks s where s.id = streak_id and s.user_id = auth.uid())
  ) with check (
    auth.uid() = user_id and
    exists (select 1 from public.streaks s where s.id = streak_id and s.user_id = auth.uid())
  );

create policy "streak_logs_delete_own" on public.streak_logs
  for delete using (
    auth.uid() = user_id and
    exists (select 1 from public.streaks s where s.id = streak_id and s.user_id = auth.uid())
  );

-- ==============================================================================
-- 4. DAILY CHECK-INS
-- ==============================================================================
drop policy if exists "daily_checkins_select_own" on public.daily_checkins;
drop policy if exists "daily_checkins_insert_own" on public.daily_checkins;
drop policy if exists "daily_checkins_update_own" on public.daily_checkins;
drop policy if exists "daily_checkins_delete_own" on public.daily_checkins;
drop policy if exists "daily_checkins_user_isolation" on public.daily_checkins;

create policy "daily_checkins_select_own" on public.daily_checkins
  for select using (auth.uid() = user_id);

create policy "daily_checkins_insert_own" on public.daily_checkins
  for insert with check (auth.uid() = user_id);

create policy "daily_checkins_update_own" on public.daily_checkins
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_checkins_delete_own" on public.daily_checkins
  for delete using (auth.uid() = user_id);

-- ==============================================================================
-- 5. HOBBIES
-- ==============================================================================
drop policy if exists "hobbies_select_own" on public.hobbies;
drop policy if exists "hobbies_insert_own" on public.hobbies;
drop policy if exists "hobbies_update_own" on public.hobbies;
drop policy if exists "hobbies_delete_own" on public.hobbies;
drop policy if exists "hobbies_user_isolation" on public.hobbies;

create policy "hobbies_select_own" on public.hobbies
  for select using (auth.uid() = user_id);

create policy "hobbies_insert_own" on public.hobbies
  for insert with check (auth.uid() = user_id);

create policy "hobbies_update_own" on public.hobbies
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "hobbies_delete_own" on public.hobbies
  for delete using (auth.uid() = user_id);

-- ==============================================================================
-- 6. HOBBY SESSIONS (CHILD TABLE - JOIN CHECK ON PARENT HOBBY)
-- ==============================================================================
drop policy if exists "hobby_sessions_select_own" on public.hobby_sessions;
drop policy if exists "hobby_sessions_insert_own" on public.hobby_sessions;
drop policy if exists "hobby_sessions_update_own" on public.hobby_sessions;
drop policy if exists "hobby_sessions_delete_own" on public.hobby_sessions;
drop policy if exists "hobby_sessions_user_isolation" on public.hobby_sessions;

create policy "hobby_sessions_select_own" on public.hobby_sessions
  for select using (
    auth.uid() = user_id and
    exists (select 1 from public.hobbies h where h.id = hobby_id and h.user_id = auth.uid())
  );

create policy "hobby_sessions_insert_own" on public.hobby_sessions
  for insert with check (
    auth.uid() = user_id and
    exists (select 1 from public.hobbies h where h.id = hobby_id and h.user_id = auth.uid())
  );

create policy "hobby_sessions_update_own" on public.hobby_sessions
  for update using (
    auth.uid() = user_id and
    exists (select 1 from public.hobbies h where h.id = hobby_id and h.user_id = auth.uid())
  ) with check (
    auth.uid() = user_id and
    exists (select 1 from public.hobbies h where h.id = hobby_id and h.user_id = auth.uid())
  );

create policy "hobby_sessions_delete_own" on public.hobby_sessions
  for delete using (
    auth.uid() = user_id and
    exists (select 1 from public.hobbies h where h.id = hobby_id and h.user_id = auth.uid())
  );

-- ==============================================================================
-- 7. TASK LISTS
-- ==============================================================================
drop policy if exists "task_lists_select_own" on public.task_lists;
drop policy if exists "task_lists_insert_own" on public.task_lists;
drop policy if exists "task_lists_update_own" on public.task_lists;
drop policy if exists "task_lists_delete_own" on public.task_lists;
drop policy if exists "task_lists_user_isolation" on public.task_lists;

create policy "task_lists_select_own" on public.task_lists
  for select using (auth.uid() = user_id);

create policy "task_lists_insert_own" on public.task_lists
  for insert with check (auth.uid() = user_id);

create policy "task_lists_update_own" on public.task_lists
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "task_lists_delete_own" on public.task_lists
  for delete using (auth.uid() = user_id);

-- ==============================================================================
-- 8. TASKS
-- ==============================================================================
drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;
drop policy if exists "tasks_user_isolation" on public.tasks;

create policy "tasks_select_own" on public.tasks
  for select using (auth.uid() = user_id);

create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "tasks_update_own" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks_delete_own" on public.tasks
  for delete using (auth.uid() = user_id);

-- ==============================================================================
-- 9. JOURNAL ENTRIES
-- ==============================================================================
drop policy if exists "journal_entries_select_own" on public.journal_entries;
drop policy if exists "journal_entries_insert_own" on public.journal_entries;
drop policy if exists "journal_entries_update_own" on public.journal_entries;
drop policy if exists "journal_entries_delete_own" on public.journal_entries;
drop policy if exists "journal_entries_user_isolation" on public.journal_entries;

create policy "journal_entries_select_own" on public.journal_entries
  for select using (auth.uid() = user_id);

create policy "journal_entries_insert_own" on public.journal_entries
  for insert with check (auth.uid() = user_id);

create policy "journal_entries_update_own" on public.journal_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "journal_entries_delete_own" on public.journal_entries
  for delete using (auth.uid() = user_id);

-- ==============================================================================
-- 10. FINANCE WEEKS
-- ==============================================================================
drop policy if exists "finance_weeks_select_own" on public.finance_weeks;
drop policy if exists "finance_weeks_insert_own" on public.finance_weeks;
drop policy if exists "finance_weeks_update_own" on public.finance_weeks;
drop policy if exists "finance_weeks_delete_own" on public.finance_weeks;
drop policy if exists "finance_weeks_user_isolation" on public.finance_weeks;

create policy "finance_weeks_select_own" on public.finance_weeks
  for select using (auth.uid() = user_id);

create policy "finance_weeks_insert_own" on public.finance_weeks
  for insert with check (auth.uid() = user_id);

create policy "finance_weeks_update_own" on public.finance_weeks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "finance_weeks_delete_own" on public.finance_weeks
  for delete using (auth.uid() = user_id);

-- ==============================================================================
-- 11. FINANCE EXPENSES (CHILD TABLE - JOIN CHECK ON PARENT FINANCE WEEK)
-- ==============================================================================
drop policy if exists "finance_expenses_select_own" on public.finance_expenses;
drop policy if exists "finance_expenses_insert_own" on public.finance_expenses;
drop policy if exists "finance_expenses_update_own" on public.finance_expenses;
drop policy if exists "finance_expenses_delete_own" on public.finance_expenses;
drop policy if exists "finance_expenses_user_isolation" on public.finance_expenses;

create policy "finance_expenses_select_own" on public.finance_expenses
  for select using (
    auth.uid() = user_id and
    exists (select 1 from public.finance_weeks w where w.id = week_id and w.user_id = auth.uid())
  );

create policy "finance_expenses_insert_own" on public.finance_expenses
  for insert with check (
    auth.uid() = user_id and
    exists (select 1 from public.finance_weeks w where w.id = week_id and w.user_id = auth.uid())
  );

create policy "finance_expenses_update_own" on public.finance_expenses
  for update using (
    auth.uid() = user_id and
    exists (select 1 from public.finance_weeks w where w.id = week_id and w.user_id = auth.uid())
  ) with check (
    auth.uid() = user_id and
    exists (select 1 from public.finance_weeks w where w.id = week_id and w.user_id = auth.uid())
  );

create policy "finance_expenses_delete_own" on public.finance_expenses
  for delete using (
    auth.uid() = user_id and
    exists (select 1 from public.finance_weeks w where w.id = week_id and w.user_id = auth.uid())
  );

-- ==============================================================================
-- 12. FINANCE WISHLIST
-- ==============================================================================
drop policy if exists "finance_wishlist_select_own" on public.finance_wishlist;
drop policy if exists "finance_wishlist_insert_own" on public.finance_wishlist;
drop policy if exists "finance_wishlist_update_own" on public.finance_wishlist;
drop policy if exists "finance_wishlist_delete_own" on public.finance_wishlist;
drop policy if exists "finance_wishlist_user_isolation" on public.finance_wishlist;

create policy "finance_wishlist_select_own" on public.finance_wishlist
  for select using (auth.uid() = user_id);

create policy "finance_wishlist_insert_own" on public.finance_wishlist
  for insert with check (auth.uid() = user_id);

create policy "finance_wishlist_update_own" on public.finance_wishlist
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "finance_wishlist_delete_own" on public.finance_wishlist
  for delete using (auth.uid() = user_id);

-- ==============================================================================
-- 13. GOALS
-- ==============================================================================
drop policy if exists "goals_select_own" on public.goals;
drop policy if exists "goals_insert_own" on public.goals;
drop policy if exists "goals_update_own" on public.goals;
drop policy if exists "goals_delete_own" on public.goals;
drop policy if exists "goals_user_isolation" on public.goals;

create policy "goals_select_own" on public.goals
  for select using (auth.uid() = user_id);

create policy "goals_insert_own" on public.goals
  for insert with check (auth.uid() = user_id);

create policy "goals_update_own" on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals_delete_own" on public.goals
  for delete using (auth.uid() = user_id);

-- ==============================================================================
-- 14. GOAL MILESTONES (CHILD TABLE - JOIN CHECK ON PARENT GOAL)
-- ==============================================================================
drop policy if exists "goal_milestones_select_own" on public.goal_milestones;
drop policy if exists "goal_milestones_insert_own" on public.goal_milestones;
drop policy if exists "goal_milestones_update_own" on public.goal_milestones;
drop policy if exists "goal_milestones_delete_own" on public.goal_milestones;
drop policy if exists "goal_milestones_user_isolation" on public.goal_milestones;

create policy "goal_milestones_select_own" on public.goal_milestones
  for select using (
    auth.uid() = user_id and
    exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
  );

create policy "goal_milestones_insert_own" on public.goal_milestones
  for insert with check (
    auth.uid() = user_id and
    exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
  );

create policy "goal_milestones_update_own" on public.goal_milestones
  for update using (
    auth.uid() = user_id and
    exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
  ) with check (
    auth.uid() = user_id and
    exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
  );

create policy "goal_milestones_delete_own" on public.goal_milestones
  for delete using (
    auth.uid() = user_id and
    exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
  );

-- ==============================================================================
-- 15. PERFORMANCE INDEXES
-- ==============================================================================
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_deadline on public.tasks(deadline);
create index if not exists idx_hobbies_user_id on public.hobbies(user_id);
create index if not exists idx_hobby_sessions_user_id on public.hobby_sessions(user_id);
create index if not exists idx_hobby_sessions_hobby_id on public.hobby_sessions(hobby_id);
create index if not exists idx_journal_user_id on public.journal_entries(user_id);
create index if not exists idx_journal_entry_date on public.journal_entries(entry_date);
create index if not exists idx_finance_weeks_user_id on public.finance_weeks(user_id);
create index if not exists idx_finance_expenses_user_id on public.finance_expenses(user_id);
create index if not exists idx_finance_expenses_week_id on public.finance_expenses(week_id);
create index if not exists idx_finance_wishlist_user_id on public.finance_wishlist(user_id);
create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_goal_milestones_user_id on public.goal_milestones(user_id);
create index if not exists idx_goal_milestones_goal_id on public.goal_milestones(goal_id);
create index if not exists idx_streaks_user_id on public.streaks(user_id);
create index if not exists idx_streak_logs_user_id on public.streak_logs(user_id);
create index if not exists idx_daily_checkins_user_id on public.daily_checkins(user_id);
