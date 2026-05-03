-- Admission applications table for the applicant submission flow.
-- Applicants (anonymous) can submit; admins can manage all records.

begin;

create table if not exists public.admission_applications (
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null,
  email            text not null,
  phone            text,
  date_of_birth    date,
  department_id    uuid references public.departments(id) on delete set null,
  gpa              numeric(3, 2),
  personal_statement text,
  status           text not null default 'pending'
                     check (status in ('pending', 'approved', 'rejected')),
  admin_notes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.admission_applications enable row level security;

-- Allow anonymous and authenticated users to submit applications.
create policy "applications_insert_public"
on public.admission_applications
for insert
to anon, authenticated
with check (true);

-- Only admins can read all applications.
create policy "applications_select_admin"
on public.admission_applications
for select
to authenticated
using (public.current_user_profile_role() = 'admin');

-- Only admins can update (approve/reject/edit) applications.
create policy "applications_update_admin"
on public.admission_applications
for update
to authenticated
using (public.current_user_profile_role() = 'admin')
with check (public.current_user_profile_role() = 'admin');

-- Only admins can delete applications.
create policy "applications_delete_admin"
on public.admission_applications
for delete
to authenticated
using (public.current_user_profile_role() = 'admin');

commit;
