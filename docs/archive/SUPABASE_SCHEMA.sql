-- Supabase schema for workbook editor (Phase 2A)

-- 1. workbooks table
create table if not exists public.workbooks (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    owner_id uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

-- 2. worksheets table
create table if not exists public.worksheets (
    id uuid primary key default gen_random_uuid(),
    workbook_id uuid not null references public.workbooks(id) on delete cascade,
    title text not null,
    position integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 3. column_metadata table
create table if not exists public.column_metadata (
    id uuid primary key default gen_random_uuid(),
    worksheet_id uuid not null references public.worksheets(id) on delete cascade,
    name text not null,
    display_name text not null,
    data_type text not null,
    "order" integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 4. worksheet_rows table (JSONB payload)
create table if not exists public.worksheet_rows (
    id uuid primary key default gen_random_uuid(),
    worksheet_id uuid not null references public.worksheets(id) on delete cascade,
    data jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 5. user_roles table (RBAC mapping)
create table if not exists public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    workbook_id uuid not null references public.workbooks(id) on delete cascade,
    role text not null check (role in ('owner','editor','viewer')),
    created_at timestamptz not null default now()
);

-- 6. audit_logs table
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    action text not null check (action in ('INSERT','UPDATE','DELETE')),
    table_name text not null,
    record_id uuid not null,
    payload jsonb,
    timestamp timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_worksheets_workbook_id on public.worksheets(workbook_id);
create index if not exists idx_column_metadata_worksheet_id on public.column_metadata(worksheet_id);
create index if not exists idx_worksheet_rows_worksheet_id on public.worksheet_rows(worksheet_id);
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_workbook_id on public.user_roles(workbook_id);
