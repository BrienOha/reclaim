-- ==============================================================================
-- RECLAIM APP: CLEANUP SCRIPT TO WIPE TEST DATA FROM DUMMY ACCOUNT
-- Safe to run even if tables have not been created yet!
-- ==============================================================================

do $$
declare
  dummy_uuid uuid := '00000000-0000-0000-0000-000000000000';
  dummy_email text := 'reclaim@personal.app';
begin
  -- Delete from tables only if they exist
  if to_regclass('public.streak_logs') is not null then
    delete from public.streak_logs where user_id = dummy_uuid;
  end if;
  if to_regclass('public.streaks') is not null then
    delete from public.streaks where user_id = dummy_uuid;
  end if;
  if to_regclass('public.hobby_sessions') is not null then
    delete from public.hobby_sessions where user_id = dummy_uuid;
  end if;
  if to_regclass('public.hobbies') is not null then
    delete from public.hobbies where user_id = dummy_uuid;
  end if;
  if to_regclass('public.tasks') is not null then
    delete from public.tasks where user_id = dummy_uuid;
  end if;
  if to_regclass('public.task_lists') is not null then
    delete from public.task_lists where user_id = dummy_uuid;
  end if;
  if to_regclass('public.daily_checkins') is not null then
    delete from public.daily_checkins where user_id = dummy_uuid;
  end if;
  if to_regclass('public.journal_entries') is not null then
    delete from public.journal_entries where user_id = dummy_uuid;
  end if;
  if to_regclass('public.finance_expenses') is not null then
    delete from public.finance_expenses where user_id = dummy_uuid;
  end if;
  if to_regclass('public.finance_wishlist') is not null then
    delete from public.finance_wishlist where user_id = dummy_uuid;
  end if;
  if to_regclass('public.finance_weeks') is not null then
    delete from public.finance_weeks where user_id = dummy_uuid;
  end if;
  if to_regclass('public.goal_milestones') is not null then
    delete from public.goal_milestones where user_id = dummy_uuid;
  end if;
  if to_regclass('public.goals') is not null then
    delete from public.goals where user_id = dummy_uuid;
  end if;
  if to_regclass('public.profiles') is not null then
    delete from public.profiles where id = dummy_uuid;
  end if;

  -- Remove dummy user from auth.users if present
  delete from auth.users where email = dummy_email or id = dummy_uuid;

  raise notice 'Dummy account check & cleanup complete!';
end $$;
