-- Allow parents to read published quizzes and their child's quiz attempts
-- for registered course offerings.

begin;

create or replace function public.can_select_course_quiz(quiz_course_offering_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.can_manage_quiz_course(quiz_course_offering_id)
    or exists (
      select 1
      from public.registrations r
      where r.course_offering_id = quiz_course_offering_id
        and r.student_user_id = auth.uid()
        and r.status = 'registered'
    )
    or exists (
      select 1
      from public.parent_student_links psl
      join public.registrations r
        on r.student_user_id = psl.student_user_id
       and r.course_offering_id = quiz_course_offering_id
       and r.status = 'registered'
      where psl.parent_user_id = auth.uid()
    )
$$;

revoke all on function public.can_select_course_quiz(uuid) from public;
grant execute on function public.can_select_course_quiz(uuid) to authenticated;

drop policy if exists "quizzes_select_linked_parent" on public.quizzes;
drop policy if exists "quiz_attempts_select_linked_parent" on public.quiz_attempts;

create policy "quizzes_select_linked_parent"
on public.quizzes
for select
to authenticated
using (
  is_published
  and exists (
    select 1
    from public.parent_student_links psl
    join public.registrations r
      on r.student_user_id = psl.student_user_id
     and r.course_offering_id = quizzes.course_offering_id
     and r.status = 'registered'
    where psl.parent_user_id = auth.uid()
  )
);

create policy "quiz_attempts_select_linked_parent"
on public.quiz_attempts
for select
to authenticated
using (
  exists (
    select 1
    from public.parent_student_links psl
    where psl.parent_user_id = auth.uid()
      and psl.student_user_id = quiz_attempts.student_user_id
  )
);

commit;
