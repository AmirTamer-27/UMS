-- Fix recursion between messaging RLS policies.
--
-- The previous policies directly queried tables whose own policies queried
-- back into the original table:
-- registrations -> course_offerings -> registrations
-- parent_student_links -> registrations -> course_offerings -> parent_student_links
--
-- Security definer helpers perform the relationship checks without recursively
-- applying the caller's RLS policies inside each subquery.

begin;

create or replace function public.can_select_registration_for_messaging(
  registration_student_user_id uuid,
  registration_course_offering_id uuid
)
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
      and psl.student_user_id = registration_student_user_id
  )
  or exists (
    select 1
    from public.course_offerings co
    where co.id = registration_course_offering_id
      and co.instructor_user_id = auth.uid()
  )
$$;

create or replace function public.can_select_course_offering_for_linked_parent(
  offering_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.parent_student_links psl
    join public.registrations r
      on r.student_user_id = psl.student_user_id
    where psl.parent_user_id = auth.uid()
      and r.course_offering_id = offering_id
      and r.status = 'registered'
  )
$$;

create or replace function public.can_select_parent_student_link_for_instructor(
  linked_student_user_id uuid
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
    where r.student_user_id = linked_student_user_id
      and r.status = 'registered'
      and co.instructor_user_id = auth.uid()
  )
$$;

revoke all on function public.can_select_registration_for_messaging(uuid, uuid) from public;
revoke all on function public.can_select_course_offering_for_linked_parent(uuid) from public;
revoke all on function public.can_select_parent_student_link_for_instructor(uuid) from public;

grant execute on function public.can_select_registration_for_messaging(uuid, uuid) to authenticated;
grant execute on function public.can_select_course_offering_for_linked_parent(uuid) to authenticated;
grant execute on function public.can_select_parent_student_link_for_instructor(uuid) to authenticated;

drop policy if exists "registrations_select_linked_parent" on public.registrations;
drop policy if exists "registrations_select_course_instructor" on public.registrations;
drop policy if exists "course_offerings_select_linked_parent" on public.course_offerings;
drop policy if exists "parent_student_links_select_course_instructor" on public.parent_student_links;

create policy "registrations_select_messaging_related"
on public.registrations
for select
to authenticated
using (
  public.can_select_registration_for_messaging(student_user_id, course_offering_id)
);

create policy "course_offerings_select_linked_parent"
on public.course_offerings
for select
to authenticated
using (
  public.can_select_course_offering_for_linked_parent(id)
);

create policy "parent_student_links_select_course_instructor"
on public.parent_student_links
for select
to authenticated
using (
  public.can_select_parent_student_link_for_instructor(student_user_id)
);

commit;
