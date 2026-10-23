-- ==============================================================================
-- RECLAIM APP: COMPLETE POSTGRESQL DATABASE SCHEMA & ROW LEVEL SECURITY
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  currency text not null default 'PHP',
  theme_mode text not null default 'light', -- 'light' | 'dark' | 'system'
  has_completed_onboarding boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger to create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, has_completed_onboarding)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    false
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Clean Streaks Table (Addictions / Bad Habits Recovery)
create table if not exists public.streaks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  habit_name text not null,          -- e.g. "Doomscrolling", "Social Media", "Gaming"
  category text not null default 'Digital',
  started_at timestamptz not null default now(),
  longest_streak_days int not null default 0,
  icon text not null default 'shield',
  accent_color text not null default '#FF5388',
  created_at timestamptz not null default now()
);

-- 3. Streak Logs (Urge Resisted, Relapse-friendly Restart, Milestones)
create table if not exists public.streak_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  streak_id uuid references public.streaks on delete cascade not null,
  event_type text not null,          -- 'urge_resisted' | 'restarted' | 'milestone'
  mood int check (mood between 1 and 5),
  trigger_reason text,               -- e.g. "Stress", "Boredom", "Late Night Fatigue"
  notes text,
  occurred_at timestamptz not null default now()
);

-- 4. Daily Check-ins (Mood 1-5 & Quote/Notes)
create table if not exists public.daily_checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  checkin_date date not null default current_date,
  mood int not null check (mood between 1 and 5),
  journal_note text,
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

-- 5. Hobbies Table
create table if not exists public.hobbies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,               -- Drawing, Film/Videography, Editing, Graphic Design, Music
  description text,
  icon text not null default 'palette',
  color text not null default '#FFE600',
  mini_projects jsonb not null default '[]'::jsonb,
  creative_challenges jsonb not null default '[]'::jsonb,
  total_minutes_logged int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 6. Hobby Sessions
create table if not exists public.hobby_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  hobby_id uuid references public.hobbies on delete cascade not null,
  duration_minutes int not null,
  notes text,
  attachment_urls text[] not null default array[]::text[],
  completed_at timestamptz not null default now()
);

-- 7. Task Lists / Projects
create table if not exists public.task_lists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text not null default '#38B6FF',
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- 8. Tasks (Notion-like with deadlines, priority, subtasks, tags)
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  list_id uuid references public.task_lists on delete set null,
  goal_id uuid,
  title text not null,
  notes text,
  deadline timestamptz,
  priority text not null default 'medium', -- 'low', 'medium', 'high', 'urgent'
  tags text[] not null default array[]::text[],
  subtasks jsonb not null default '[]'::jsonb, -- [{ id, title, completed }]
  is_completed boolean not null default false,
  completed_at timestamptz,
  is_recurring boolean not null default false,
  recurrence_rule text,              -- 'daily', 'weekly', 'weekdays'
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Journal Entries
create table if not exists public.journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  entry_date date not null default current_date,
  title text not null,
  body text not null,
  mood int check (mood between 1 and 5),
  font_family text not null default 'Space Grotesk',
  canvas_layout jsonb not null default '[]'::jsonb, -- [{ id, type: 'photo'|'sticker', uri, x, y, width, height, zIndex, borderColor, borderWidth }]
  exported_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10. Finance Weeks (Weekly Tracker)
create table if not exists public.finance_weeks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  week_start_date date not null,
  allowance_amount numeric(12, 2) not null default 0.00,
  savings_allocation numeric(12, 2) not null default 0.00,
  currency text not null default 'PHP',
  created_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);

-- 11. Finance Expenses
create table if not exists public.finance_expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  week_id uuid references public.finance_weeks on delete cascade not null,
  expense_date date not null default current_date,
  amount numeric(12, 2) not null,
  category text not null,            -- Food, Commute, Gear, Entertainment, Subscriptions, Misc
  note text,
  created_at timestamptz not null default now()
);

-- 12. Finance Wishlist (Purchase Goals)
create table if not exists public.finance_wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  item_name text not null,
  price numeric(12, 2) not null,
  image_url text,
  link_url text,
  priority text not null default 'medium',
  is_bought boolean not null default false,
  bought_at timestamptz,
  created_at timestamptz not null default now()
);

-- 13. Goals (3 Tiers: Small, Big, Life)
create table if not exists public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  tier text not null check (tier in ('small', 'big', 'life')),
  title text not null,
  description text,
  category text not null default 'Creative',
  target_date date,
  cover_image_url text,
  is_pinned_of_week boolean not null default false,
  is_archived boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 14. Goal Milestones
create table if not exists public.goal_milestones (
  id uuid default gen_random_uuid() primary key,
  goal_id uuid references public.goals on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  is_completed boolean not null default false,
  linked_task_id uuid references public.tasks on delete set null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
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

-- Drop existing policies if re-running
drop policy if exists "profiles_self_access" on public.profiles;
create policy "profiles_self_access" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

do $$
declare
  tbl text;
begin
  for tbl in select tablename from pg_tables where schemaname = 'public' and tablename != 'profiles'
  loop
    execute format('drop policy if exists "%s_user_isolation" on public.%I;', tbl, tbl);
    execute format('create policy "%s_user_isolation" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);', tbl, tbl);
  end loop;
end $$;

-- Storage Buckets Configuration
insert into storage.buckets (id, name, public) 
values ('journal-images', 'journal-images', true) 
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('goal-covers', 'goal-covers', true) 
on conflict (id) do nothing;

-- Storage RLS
drop policy if exists "journal_storage_user_policy" on storage.objects;
create policy "journal_storage_user_policy" on storage.objects for all 
using (bucket_id in ('journal-images', 'goal-covers') and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id in ('journal-images', 'goal-covers') and auth.uid()::text = (storage.foldername(name))[1]);
