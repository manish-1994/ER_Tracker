-- Supabase schema for workbook editor (Phase 2A)

-- 1. workbooks table
create table if not exists public.workbooks (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    owner_id text not null,
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
    user_id text not null,
    workbook_id uuid not null references public.workbooks(id) on delete cascade,
    role text not null check (role in ('owner','editor','viewer')),
    created_at timestamptz not null default now()
);

-- 6. audit_logs table
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    user_id text not null,
    action text not null check (action in ('INSERT','UPDATE','DELETE')),
    table_name text not null,
    record_id uuid not null,
    payload jsonb,
    timestamp timestamptz not null default now()
);

-- 7. users table (custom authentication)
create table if not exists public.users (
    id text primary key,
    username text not null unique,
    hashed_password text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

-- 8. roles table (role definitions)
create table if not exists public.roles (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    created_at timestamptz not null default now()
);

-- 9. permissions table
create table if not exists public.permissions (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    created_at timestamptz not null default now()
);

-- 10. role_permissions table
create table if not exists public.role_permissions (
    id uuid primary key default gen_random_uuid(),
    role_id uuid not null references public.roles(id) on delete cascade,
    permission_id uuid not null references public.permissions(id) on delete cascade,
    created_at timestamptz not null default now()
);

-- 11. dashboard_widgets table
create table if not exists public.dashboard_widgets (
    id uuid primary key default gen_random_uuid(),
    user_id text not null references public.users(id) on delete cascade,
    title text not null,
    widget_type text not null check (widget_type in ('kpi','table','bar','pie','line','donut','area')),
    workbook_id uuid not null references public.workbooks(id) on delete cascade,
    worksheet_id uuid not null references public.worksheets(id) on delete cascade,
    workbook_name text,
    worksheet_name text,
    value_col text not null,
    value_cols jsonb,
    group_by_col text,
    aggregation text not null check (aggregation in ('count','sum','avg','none')),
    config jsonb,
    created_by text not null references public.users(id),
    created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_worksheets_workbook_id on public.worksheets(workbook_id);
create index if not exists idx_column_metadata_worksheet_id on public.column_metadata(worksheet_id);
create index if not exists idx_worksheet_rows_worksheet_id on public.worksheet_rows(worksheet_id);
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_workbook_id on public.user_roles(workbook_id);
create index if not exists idx_dashboard_widgets_user_id on public.dashboard_widgets(user_id);
create index if not exists idx_dashboard_widgets_created_by on public.dashboard_widgets(created_by);