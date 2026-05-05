alter table public.staff_profiles enable row level security;

drop policy if exists "staff_profiles_select_own" on public.staff_profiles;
drop policy if exists "staff_profiles_update_own" on public.staff_profiles;

create policy "staff_profiles_select_own"
on public.staff_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "staff_profiles_update_own"
on public.staff_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
