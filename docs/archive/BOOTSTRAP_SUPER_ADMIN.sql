-- BOOTSTRAP_SUPER_ADMIN.sql
-- Insert a super_admin role for the primary project administrator.
-- This script assumes that at least one authenticated user already exists in the auth.users table.
-- It will insert a row into public.system_roles with role = 'super_admin' for the first user found.

do $$
declare
    primary_user_id uuid;
begin
    -- Select the earliest created user (or any deterministic choice)
    select id into primary_user_id
    from auth.users
    order by created_at asc
    limit 1;

    if primary_user_id is not null then
        insert into public.system_roles (user_id, role)
        values (primary_user_id, 'super_admin')
        on conflict do nothing; -- avoid duplicate if already present
    else
        raise notice 'No users found in auth.users; cannot bootstrap super_admin.';
    end if;
end $$;
