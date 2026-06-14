-- Migration to create custom authentication tables
create extension if not exists "uuid-ossp";

create table if not exists public.users (
    id uuid primary key default uuid_generate_v4(),
    username text not null unique,
    password_hash text not null,
    role text not null check (role in ('viewer','editor','owner','superadmin')),
    status text not null default 'active',
    created_at timestamp not null default now()
);

create table if not exists public.user_sessions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.users(id) on delete cascade,
    session_token uuid not null unique,
    expires_at timestamp not null,
    created_at timestamp not null default now()
);

-- Indexes for quick look‑up
create index if not exists idx_users_username on public.users(username);
create index if not exists idx_sessions_token on public.user_sessions(session_token);

-- Insert initial SuperAdmin (password should be set via secure process)
insert into public.users (username, password_hash, role, status)
values ('superadmin', crypt('SuperSecret123', gen_salt('bf')), 'superadmin', 'active')
on conflict do nothing;