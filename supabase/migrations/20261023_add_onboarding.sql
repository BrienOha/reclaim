-- ==============================================================================
-- RECLAIM APP: ADD ONBOARDING STATUS AND PROFILE TRIGGER
-- Run this if you already initialized the database earlier and just need the onboarding additions.
-- ==============================================================================

-- 1. Add has_completed_onboarding to profiles table
alter table public.profiles
  add column if not exists has_completed_onboarding boolean not null default false;

-- 2. Update the handle_new_user() trigger function to populate onboarding status
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

-- 3. Re-create the trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
