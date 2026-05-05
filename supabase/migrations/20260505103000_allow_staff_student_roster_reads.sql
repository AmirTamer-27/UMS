-- Allow teachers and staff to read roster details for students registered in
-- their assigned course offerings.

begin;

create or replace function public.can_select_student_profile_for_instructor(
  student_profile_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.registrations r
    join public.course_offerings co
      on co.id = r.course_offering_id
    where r.student_user_id = student_profile_user_id
      and r.status = 'registered'
      and co.instructor_user_id = auth.uid()
  )
$$;

revoke all on function public.can_select_student_profile_for_instructor(uuid) from public;
grant execute on function public.can_select_student_profile_for_instructor(uuid) to authenticated;

drop policy if exists "student_profiles_select_course_instructor_roster" on public.student_profiles;

create policy "student_profiles_select_course_instructor_roster"
on public.student_profiles
for select
to authenticated
using (
  public.can_select_student_profile_for_instructor(user_id)
);

commit;
