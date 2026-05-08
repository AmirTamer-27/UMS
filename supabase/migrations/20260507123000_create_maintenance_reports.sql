-- Store student-reported maintenance issues for rooms and labs.

begin;

create table if not exists public.maintenance_reports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  reported_by_user_id uuid not null references public.profiles(id) on delete cascade,
  issue_description text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintenance_reports_status_check
    check (status in ('pending', 'in_progress', 'resolved', 'rejected'))
);

create index if not exists maintenance_reports_room_id_idx
on public.maintenance_reports(room_id);

create index if not exists maintenance_reports_reported_by_user_id_idx
on public.maintenance_reports(reported_by_user_id);

create index if not exists maintenance_reports_status_idx
on public.maintenance_reports(status);

alter table public.maintenance_reports enable row level security;

drop policy if exists "maintenance_reports_insert_student_own" on public.maintenance_reports;
drop policy if exists "maintenance_reports_select_student_own" on public.maintenance_reports;
drop policy if exists "maintenance_reports_select_admin" on public.maintenance_reports;
drop policy if exists "maintenance_reports_update_admin" on public.maintenance_reports;
drop policy if exists "maintenance_reports_delete_admin" on public.maintenance_reports;

create policy "maintenance_reports_insert_student_own"
on public.maintenance_reports
for insert
to authenticated
with check (
  reported_by_user_id = auth.uid()
  and public.current_user_profile_role() = 'student'
);

create policy "maintenance_reports_select_student_own"
on public.maintenance_reports
for select
to authenticated
using (reported_by_user_id = auth.uid());

create policy "maintenance_reports_select_admin"
on public.maintenance_reports
for select
to authenticated
using (public.current_user_profile_role() = 'admin');

create policy "maintenance_reports_update_admin"
on public.maintenance_reports
for update
to authenticated
using (public.current_user_profile_role() = 'admin')
with check (public.current_user_profile_role() = 'admin');

create policy "maintenance_reports_delete_admin"
on public.maintenance_reports
for delete
to authenticated
using (public.current_user_profile_role() = 'admin');

commit;
