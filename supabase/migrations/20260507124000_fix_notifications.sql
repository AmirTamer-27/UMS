-- Normalize notification creation for messages and course material uploads.
-- Message recipients are based on the conversation participants:
-- - parent/teacher conversations notify the other parent/teacher participant
-- - student/staff conversations notify the other student/staff participant
-- Course material uploads notify registered students in that course offering.

begin;

do $$
declare
  trigger_record record;
begin
  for trigger_record in
    select tgname, tgrelid::regclass as table_name
    from pg_trigger
    where not tgisinternal
      and tgrelid in ('public.messages'::regclass, 'public.course_materials'::regclass)
      and (tgname ilike '%notif%' or tgname ilike '%notification%')
  loop
    execute format('drop trigger if exists %I on %s', trigger_record.tgname, trigger_record.table_name);
  end loop;
end $$;

create or replace function public.create_message_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
  message_conversation record;
begin
  select student_user_id, teacher_user_id, parent_user_id
  into message_conversation
  from public.conversations
  where id = new.conversation_id;

  if message_conversation.parent_user_id is null then
    if new.sender_user_id = message_conversation.student_user_id then
      target_user_id := message_conversation.teacher_user_id;
    elsif new.sender_user_id = message_conversation.teacher_user_id then
      target_user_id := message_conversation.student_user_id;
    end if;
  else
    if new.sender_user_id = message_conversation.teacher_user_id then
      target_user_id := message_conversation.parent_user_id;
    elsif new.sender_user_id = message_conversation.parent_user_id then
      target_user_id := message_conversation.teacher_user_id;
    elsif new.sender_user_id = message_conversation.student_user_id then
      target_user_id := message_conversation.teacher_user_id;
    end if;
  end if;

  if target_user_id is not null and target_user_id <> new.sender_user_id then
    insert into public.notifications (user_id, title, body, is_read)
    values (
      target_user_id,
      'New message',
      coalesce(nullif(new.message_body, ''), 'You have a new message.'),
      false
    );
  end if;

  return new;
end;
$$;

create trigger messages_create_notification
after insert on public.messages
for each row
execute function public.create_message_notification();

create or replace function public.create_course_material_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, body, is_read)
  select distinct
    r.student_user_id,
    'New course material',
    coalesce(nullif(new.title, ''), 'Course material') || ' was uploaded.',
    false
  from public.registrations r
  where r.course_offering_id = new.course_offering_id
    and r.status = 'registered'
    and r.student_user_id is not null
    and r.student_user_id <> new.uploaded_by;

  return new;
end;
$$;

create trigger course_materials_create_notifications
after insert on public.course_materials
for each row
execute function public.create_course_material_notifications();

commit;
