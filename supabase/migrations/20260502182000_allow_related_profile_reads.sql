-- Allow parents and teachers to read the profile rows needed for messaging.
--
-- The existing profiles policies only expose a user's own profile and admin
-- reads. Parent/teacher messaging needs names for linked students, linked
-- parents, instructors, and conversation participants.

begin;

create or replace function public.can_select_related_profile(profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.parent_student_links psl
    where psl.parent_user_id = auth.uid()
      and psl.student_user_id = profile_id
  )
  or exists (
    select 1
    from public.parent_student_links psl
    join public.registrations r
      on r.student_user_id = psl.student_user_id
    join public.course_offerings co
      on co.id = r.course_offering_id
    where psl.parent_user_id = auth.uid()
      and co.instructor_user_id = profile_id
      and r.status = 'registered'
  )
  or exists (
    select 1
    from public.course_offerings co
    join public.registrations r
      on r.course_offering_id = co.id
    where co.instructor_user_id = auth.uid()
      and r.student_user_id = profile_id
      and r.status = 'registered'
  )
  or exists (
    select 1
    from public.course_offerings co
    join public.registrations r
      on r.course_offering_id = co.id
    join public.parent_student_links psl
      on psl.student_user_id = r.student_user_id
    where co.instructor_user_id = auth.uid()
      and psl.parent_user_id = profile_id
      and r.status = 'registered'
  )
  or exists (
    select 1
    from public.conversations c
    where auth.uid() in (c.parent_user_id, c.teacher_user_id, c.student_user_id)
      and profile_id in (c.parent_user_id, c.teacher_user_id, c.student_user_id)
  )
$$;

revoke all on function public.can_select_related_profile(uuid) from public;
grant execute on function public.can_select_related_profile(uuid) to authenticated;

drop policy if exists "profiles_select_related_messaging_users" on public.profiles;

create policy "profiles_select_related_messaging_users"
on public.profiles
for select
to authenticated
using (public.can_select_related_profile(id));

commit;
