-- Allow students to read the professor directory data needed for search.
--
-- This exposes only teacher/staff profile rows, their staff-profile details,
-- and department names/codes so the student-facing directory can render.

begin;

drop policy if exists "profiles_select_student_professor_directory" on public.profiles;

create policy "profiles_select_student_professor_directory"
on public.profiles
for select
to authenticated
using (
  public.current_user_profile_role() = 'student'
  and role in ('teacher', 'staff')
);

drop policy if exists "staff_profiles_select_student_professor_directory" on public.staff_profiles;

create policy "staff_profiles_select_student_professor_directory"
on public.staff_profiles
for select
to authenticated
using (
  public.current_user_profile_role() = 'student'
  and exists (
    select 1
    from public.profiles p
    where p.id = staff_profiles.user_id
      and p.role in ('teacher', 'staff')
  )
);

drop policy if exists "departments_select_authenticated" on public.departments;

create policy "departments_select_authenticated"
on public.departments
for select
to authenticated
using (true);

commit;
