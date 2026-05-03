-- Allow admins to delete rows from profiles and student_profiles.

begin;

drop policy if exists "profiles_delete_admin" on public.profiles;

create policy "profiles_delete_admin"
on public.profiles
for delete
to authenticated
using (public.current_user_profile_role() = 'admin');

alter table public.student_profiles enable row level security;

drop policy if exists "student_profiles_delete_admin" on public.student_profiles;

create policy "student_profiles_delete_admin"
on public.student_profiles
for delete
to authenticated
using (public.current_user_profile_role() = 'admin');

drop policy if exists "student_profiles_update_admin" on public.student_profiles;

create policy "student_profiles_update_admin"
on public.student_profiles
for update
to authenticated
using (public.current_user_profile_role() = 'admin')
with check (public.current_user_profile_role() = 'admin');

commit;
