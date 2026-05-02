-- Policies needed for refresh-based parent/teacher conversations.

begin;

drop policy if exists "registrations_select_course_instructor" on public.registrations;
drop policy if exists "parent_student_links_select_course_instructor" on public.parent_student_links;
drop policy if exists "conversations_select_participants" on public.conversations;
drop policy if exists "conversations_insert_participants" on public.conversations;
drop policy if exists "messages_select_conversation_participants" on public.messages;
drop policy if exists "messages_insert_conversation_participants" on public.messages;

create policy "registrations_select_course_instructor"
on public.registrations
for select
to authenticated
using (
  exists (
    select 1
    from public.course_offerings co
    where co.id = registrations.course_offering_id
      and co.instructor_user_id = auth.uid()
  )
);

create policy "parent_student_links_select_course_instructor"
on public.parent_student_links
for select
to authenticated
using (
  exists (
    select 1
    from public.registrations r
    join public.course_offerings co
      on co.id = r.course_offering_id
    where r.student_user_id = parent_student_links.student_user_id
      and r.status = 'registered'
      and co.instructor_user_id = auth.uid()
  )
);

create policy "conversations_select_participants"
on public.conversations
for select
to authenticated
using (
  auth.uid() in (parent_user_id, teacher_user_id, student_user_id)
);

create policy "conversations_insert_participants"
on public.conversations
for insert
to authenticated
with check (
  auth.uid() in (parent_user_id, teacher_user_id)
);

create policy "messages_select_conversation_participants"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and auth.uid() in (c.parent_user_id, c.teacher_user_id, c.student_user_id)
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
      and auth.uid() in (c.parent_user_id, c.teacher_user_id)
  )
);

commit;
