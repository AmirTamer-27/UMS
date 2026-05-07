-- Add grading fields for assignment submissions and quiz attempts.

begin;

alter table public.assignment_submissions
add column if not exists grade numeric;

alter table public.quiz_attempts
add column if not exists grade numeric;

create or replace function public.can_manage_assignment_submission(target_submission_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.current_user_profile_role() = 'admin'
    or exists (
      select 1
      from public.assignment_submissions s
      join public.assignments a
        on a.id = s.assignment_id
      join public.course_offerings co
        on co.id = a.course_offering_id
      where s.id = target_submission_id
        and co.instructor_user_id = auth.uid()
    )
$$;

revoke all on function public.can_manage_assignment_submission(uuid) from public;
grant execute on function public.can_manage_assignment_submission(uuid) to authenticated;

alter table public.assignment_submissions enable row level security;
alter table public.assignments enable row level security;

drop policy if exists "assignments_select_linked_parent" on public.assignments;

create policy "assignments_select_linked_parent"
on public.assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.parent_student_links psl
    join public.registrations r
      on r.student_user_id = psl.student_user_id
     and r.course_offering_id = assignments.course_offering_id
     and r.status != 'dropped'
    where psl.parent_user_id = auth.uid()
  )
);

drop policy if exists "assignment_submissions_select_course_instructor" on public.assignment_submissions;
drop policy if exists "assignment_submissions_update_course_instructor_grade" on public.assignment_submissions;

create policy "assignment_submissions_select_course_instructor"
on public.assignment_submissions
for select
to authenticated
using (
  student_user_id = auth.uid()
  or exists (
    select 1
    from public.parent_student_links psl
    where psl.parent_user_id = auth.uid()
      and psl.student_user_id = assignment_submissions.student_user_id
  )
  or public.can_manage_assignment_submission(id)
);

create policy "assignment_submissions_update_course_instructor_grade"
on public.assignment_submissions
for update
to authenticated
using (public.can_manage_assignment_submission(id))
with check (public.can_manage_assignment_submission(id));

drop policy if exists "quiz_attempts_update_course_instructor" on public.quiz_attempts;

create policy "quiz_attempts_update_course_instructor"
on public.quiz_attempts
for update
to authenticated
using (
  exists (
    select 1
    from public.quizzes q
    where q.id = quiz_attempts.quiz_id
      and public.can_manage_quiz_course(q.course_offering_id)
  )
)
with check (
  exists (
    select 1
    from public.quizzes q
    where q.id = quiz_attempts.quiz_id
      and public.can_manage_quiz_course(q.course_offering_id)
  )
);

commit;
