-- Create LMS quiz tables used by course-level quiz creation and attempts.

begin;

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_offering_id uuid not null references public.course_offerings(id) on delete cascade,
  title text not null,
  description text not null default '',
  created_by uuid not null references public.profiles(id) on delete cascade,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  correct_answer text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_user_id uuid not null references public.profiles(id) on delete cascade,
  grade numeric,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (quiz_id, student_user_id)
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  answer_text text not null default '',
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists quizzes_course_offering_id_idx
on public.quizzes(course_offering_id);

create index if not exists quiz_questions_quiz_id_idx
on public.quiz_questions(quiz_id);

create index if not exists quiz_attempts_quiz_id_idx
on public.quiz_attempts(quiz_id);

create index if not exists quiz_attempts_student_user_id_idx
on public.quiz_attempts(student_user_id);

create index if not exists quiz_answers_attempt_id_idx
on public.quiz_answers(attempt_id);

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;

create or replace function public.can_manage_quiz_course(quiz_course_offering_id uuid)
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
      from public.course_offerings co
      where co.id = quiz_course_offering_id
        and co.instructor_user_id = auth.uid()
    )
$$;

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

create or replace function public.can_select_quiz_question(question_quiz_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.quizzes q
    where q.id = question_quiz_id
      and q.is_published
      and public.can_select_course_quiz(q.course_offering_id)
  )
$$;

create or replace function public.can_answer_quiz_question(
  answer_attempt_id uuid,
  answer_question_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.quiz_attempts qa
    join public.quiz_questions qq
      on qq.id = answer_question_id
     and qq.quiz_id = qa.quiz_id
    where qa.id = answer_attempt_id
      and qa.student_user_id = auth.uid()
  )
$$;

revoke all on function public.can_manage_quiz_course(uuid) from public;
revoke all on function public.can_select_course_quiz(uuid) from public;
revoke all on function public.can_select_quiz_question(uuid) from public;
revoke all on function public.can_answer_quiz_question(uuid, uuid) from public;

grant execute on function public.can_manage_quiz_course(uuid) to authenticated;
grant execute on function public.can_select_course_quiz(uuid) to authenticated;
grant execute on function public.can_select_quiz_question(uuid) to authenticated;
grant execute on function public.can_answer_quiz_question(uuid, uuid) to authenticated;

drop policy if exists "quizzes_select_course_members" on public.quizzes;
drop policy if exists "quizzes_insert_course_instructor" on public.quizzes;
drop policy if exists "quizzes_update_course_instructor" on public.quizzes;
drop policy if exists "quizzes_delete_course_instructor" on public.quizzes;

create policy "quizzes_select_course_members"
on public.quizzes
for select
to authenticated
using (
  public.can_manage_quiz_course(course_offering_id)
  or (
    is_published
    and public.can_select_course_quiz(course_offering_id)
  )
);

create policy "quizzes_insert_course_instructor"
on public.quizzes
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_manage_quiz_course(course_offering_id)
);

create policy "quizzes_update_course_instructor"
on public.quizzes
for update
to authenticated
using (public.can_manage_quiz_course(course_offering_id))
with check (public.can_manage_quiz_course(course_offering_id));

create policy "quizzes_delete_course_instructor"
on public.quizzes
for delete
to authenticated
using (public.can_manage_quiz_course(course_offering_id));

drop policy if exists "quiz_questions_select_course_members" on public.quiz_questions;
drop policy if exists "quiz_questions_insert_course_instructor" on public.quiz_questions;
drop policy if exists "quiz_questions_update_course_instructor" on public.quiz_questions;
drop policy if exists "quiz_questions_delete_course_instructor" on public.quiz_questions;

create policy "quiz_questions_select_course_members"
on public.quiz_questions
for select
to authenticated
using (public.can_select_quiz_question(quiz_id));

create policy "quiz_questions_insert_course_instructor"
on public.quiz_questions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.quizzes q
    where q.id = quiz_questions.quiz_id
      and public.can_manage_quiz_course(q.course_offering_id)
  )
);

create policy "quiz_questions_update_course_instructor"
on public.quiz_questions
for update
to authenticated
using (
  exists (
    select 1
    from public.quizzes q
    where q.id = quiz_questions.quiz_id
      and public.can_manage_quiz_course(q.course_offering_id)
  )
)
with check (
  exists (
    select 1
    from public.quizzes q
    where q.id = quiz_questions.quiz_id
      and public.can_manage_quiz_course(q.course_offering_id)
  )
);

create policy "quiz_questions_delete_course_instructor"
on public.quiz_questions
for delete
to authenticated
using (
  exists (
    select 1
    from public.quizzes q
    where q.id = quiz_questions.quiz_id
      and public.can_manage_quiz_course(q.course_offering_id)
  )
);

drop policy if exists "quiz_attempts_select_related_users" on public.quiz_attempts;
drop policy if exists "quiz_attempts_insert_registered_student" on public.quiz_attempts;
drop policy if exists "quiz_attempts_update_course_instructor" on public.quiz_attempts;

create policy "quiz_attempts_select_related_users"
on public.quiz_attempts
for select
to authenticated
using (
  student_user_id = auth.uid()
  or exists (
    select 1
    from public.parent_student_links psl
    where psl.parent_user_id = auth.uid()
      and psl.student_user_id = quiz_attempts.student_user_id
  )
  or exists (
    select 1
    from public.quizzes q
    where q.id = quiz_attempts.quiz_id
      and public.can_manage_quiz_course(q.course_offering_id)
  )
);

create policy "quiz_attempts_insert_registered_student"
on public.quiz_attempts
for insert
to authenticated
with check (
  student_user_id = auth.uid()
  and exists (
    select 1
    from public.quizzes q
    where q.id = quiz_attempts.quiz_id
      and q.is_published
      and public.can_select_course_quiz(q.course_offering_id)
  )
);

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

drop policy if exists "quiz_answers_select_related_users" on public.quiz_answers;
drop policy if exists "quiz_answers_insert_attempt_owner" on public.quiz_answers;

create policy "quiz_answers_select_related_users"
on public.quiz_answers
for select
to authenticated
using (
  exists (
    select 1
    from public.quiz_attempts qa
    join public.quizzes q
      on q.id = qa.quiz_id
    where qa.id = quiz_answers.attempt_id
      and (
        qa.student_user_id = auth.uid()
        or public.can_manage_quiz_course(q.course_offering_id)
      )
  )
);

create policy "quiz_answers_insert_attempt_owner"
on public.quiz_answers
for insert
to authenticated
with check (
  public.can_answer_quiz_question(attempt_id, question_id)
);

commit;
