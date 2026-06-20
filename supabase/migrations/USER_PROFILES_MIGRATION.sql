-- Migration: create user_profiles table for username based auth
create table if not exists public.user_profiles (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid not null references auth.users(id) on delete cascade,
    username text not null unique,
    role text not null check (role in ('viewer','editor','owner','superadmin')),
    status text not null default 'active',
    created_at timestamp not null default now()
);

-- RLS policy: allow users to read their own profile
create policy "allow select own profile" on public.user_profiles
    for select using (auth.uid() = auth_user_id);

-- RLS policy: allow superadmin to manage all profiles (example placeholder)
create policy "superadmin manage" on public.user_profiles
    for all using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'superadmin'));