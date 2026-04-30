-- Fix recursive RLS policies on public.profiles.
--
-- Run this in the Supabase SQL Editor, or apply it with the Supabase CLI.
-- The common broken shape is a profiles policy that checks admin role by
-- selecting from public.profiles inside a policy on public.profiles.

begin;

create or replace function public.current_user_profile_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.role::text
  from public.profiles as p
  where p.id = auth.uid()
  limit 1
$$;

revoke all on function public.current_user_profile_role() from public;
grant execute on function public.current_user_profile_role() to authenticated;

alter table public.profiles enable row level security;

do $$
declare
  profile_policy record;
begin
  for profile_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
  loop
    execute format(
      'drop policy if exists %I on public.profiles',
      profile_policy.policyname
    );
  end loop;
end
$$;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_select_admin"
on public.profiles
for select
to authenticated
using (public.current_user_profile_role() = 'admin');

create policy "profiles_insert_admin"
on public.profiles
for insert
to authenticated
with check (public.current_user_profile_role() = 'admin');

create policy "profiles_update_admin"
on public.profiles
for update
to authenticated
using (public.current_user_profile_role() = 'admin')
with check (public.current_user_profile_role() = 'admin');

commit;
