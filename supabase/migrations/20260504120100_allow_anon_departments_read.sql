-- Allow anonymous users to read departments so the public admission
-- application form can populate the department dropdown.

begin;

alter table public.departments enable row level security;

drop policy if exists "departments_select_public" on public.departments;

create policy "departments_select_public"
on public.departments
for select
to anon, authenticated
using (true);

commit;
