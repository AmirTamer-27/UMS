-- Let parents resolve teachers through their linked child's registrations.
--
-- Parent messaging looks up:
-- parent_student_links -> registrations -> course_offerings -> profiles.
-- Without these select policies, RLS can make the registrations query return an
-- empty array, which looks like "no registered teacher" in the UI.

begin;

drop policy if exists "registrations_select_linked_parent" on public.registrations;
drop policy if exists "course_offerings_select_linked_parent" on public.course_offerings;

create policy "registrations_select_linked_parent"
on public.registrations
for select
to authenticated
using (
  exists (
    select 1
    from public.parent_student_links psl
    where psl.parent_user_id = auth.uid()
      and psl.student_user_id = registrations.student_user_id
  )
);

create policy "course_offerings_select_linked_parent"
on public.course_offerings
for select
to authenticated
using (
  exists (
    select 1
    from public.parent_student_links psl
    join public.registrations r
      on r.student_user_id = psl.student_user_id
    where psl.parent_user_id = auth.uid()
      and r.course_offering_id = course_offerings.id
      and r.status = 'registered'
  )
);

commit;
