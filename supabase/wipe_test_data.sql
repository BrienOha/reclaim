-- ==============================================================================
-- RECLAIM APP: CLEANUP SCRIPT TO WIPE TEST DATA FROM DUMMY ACCOUNT
-- Run this in Supabase SQL Editor to wipe dummy test rows before creating your real account.
-- ==============================================================================

do $$
declare
  dummy_uuid uuid := '00000000-0000-0000-0000-000000000000';
  dummy_email text := 'reclaim@personal.app';
begin
  -- 1. Delete rows associated with the dummy UUID in all tables
  delete from public.streak_logs where user_id = dummy_uuid;
  delete from public.streaks where user_id = dummy_uuid;
  delete from public.hobby_sessions where user_id = dummy_uuid;
  delete from public.hobbies where user_id = dummy_uuid;
  delete from public.tasks where user_id = dummy_uuid;
  delete from public.task_lists where user_id = dummy_uuid;
  delete from public.daily_checkins where user_id = dummy_uuid;
  delete from public.journal_entries where user_id = dummy_uuid;
  delete from public.finance_expenses where user_id = dummy_uuid;
  delete from public.finance_wishlist where user_id = dummy_uuid;
  delete from public.finance_weeks where user_id = dummy_uuid;
  delete from public.goal_milestones where user_id = dummy_uuid;
  delete from public.goals where user_id = dummy_uuid;
  delete from public.profiles where id = dummy_uuid;

  -- 2. If dummy user was created in auth.users, remove it
  delete from auth.users where email = dummy_email or id = dummy_uuid;

  raise notice 'Dummy account data successfully wiped!';
end $$;
