-- RPC function that deletes a student's profile, student_profiles row,
-- and their auth.users entry in one call. Runs as SECURITY DEFINER so it
-- can reach the auth schema without exposing the service-role key.

create or replace function public.admin_delete_student(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_profile_role() != 'admin' then
    raise exception 'Admin only';
  end if;

  delete from public.student_profiles where user_id = target_user_id;
  delete from public.profiles where id = target_user_id;
  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.admin_delete_student(uuid) from public;
grant execute on function public.admin_delete_student(uuid) to authenticated;
