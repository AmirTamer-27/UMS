-- Support direct student/staff conversation threads.
--
-- Existing parent-teacher conversations keep parent_user_id populated. Direct
-- student-staff threads leave parent_user_id null and are limited to students
-- registered in the staff member's assigned course offerings.

begin;

alter table public.conversations
alter column parent_user_id drop not null;

create or replace function public.can_create_student_staff_conversation(
  conversation_student_user_id uuid,
  conversation_teacher_user_id uuid
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
    where r.student_user_id = conversation_student_user_id
      and r.status = 'registered'
      and co.instructor_user_id = conversation_teacher_user_id
  )
$$;

revoke all on function public.can_create_student_staff_conversation(uuid, uuid) from public;
grant execute on function public.can_create_student_staff_conversation(uuid, uuid) to authenticated;

drop policy if exists "conversations_insert_participants" on public.conversations;
drop policy if exists "messages_insert_conversation_participants" on public.messages;

create policy "conversations_insert_participants"
on public.conversations
for insert
to authenticated
with check (
  (
    parent_user_id is not null
    and auth.uid() in (parent_user_id, teacher_user_id)
  )
  or (
    parent_user_id is null
    and auth.uid() in (student_user_id, teacher_user_id)
    and public.can_create_student_staff_conversation(student_user_id, teacher_user_id)
  )
);

create policy "messages_insert_conversation_participants"
on public.messages
for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and auth.uid() in (c.parent_user_id, c.teacher_user_id, c.student_user_id)
  )
);

commit;
