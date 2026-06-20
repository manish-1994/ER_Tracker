-- RLS policies for Supabase workbook editor (Phase 2A)

-- Enable RLS on all tables
alter table public.workbooks enable row level security;
alter table public.worksheets enable row level security;
alter table public.column_metadata enable row level security;
alter table public.worksheet_rows enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;

-- 1. workbooks policies
-- Owners can select, insert, update, delete their own workbooks
create policy workbooks_owner_select on public.workbooks for select using (owner_id = auth.uid());
create policy workbooks_owner_insert on public.workbooks for insert with check (owner_id = auth.uid());
create policy workbooks_owner_update on public.workbooks for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy workbooks_owner_delete on public.workbooks for delete using (owner_id = auth.uid());

-- Editors and viewers can select workbooks they have a role for
create policy workbooks_role_select on public.workbooks for select using (
    exists (select 1 from public.user_roles ur where ur.workbook_id = workbooks.id and ur.user_id = auth.uid() and ur.role in ('editor','viewer'))
);

-- 2. worksheets policies
-- Access is granted based on workbook role
create policy worksheets_select on public.worksheets for select using (
    exists (select 1 from public.user_roles ur
            join public.workbooks wb on wb.id = ur.workbook_id
            where wb.id = worksheets.workbook_id and ur.user_id = auth.uid() and ur.role in ('owner','editor','viewer'))
);
create policy worksheets_insert on public.worksheets for insert with check (
    exists (select 1 from public.user_roles ur where ur.workbook_id = workbook_id and ur.user_id = auth.uid() and ur.role = 'owner')
);
create policy worksheets_update on public.worksheets for update using (
    exists (select 1 from public.user_roles ur where ur.workbook_id = workbook_id and ur.user_id = auth.uid() and ur.role = 'owner')
) with check (
    exists (select 1 from public.user_roles ur where ur.workbook_id = workbook_id and ur.user_id = auth.uid() and ur.role = 'owner')
);
create policy worksheets_delete on public.worksheets for delete using (
    exists (select 1 from public.user_roles ur where ur.workbook_id = workbook_id and ur.user_id = auth.uid() and ur.role = 'owner')
);

-- 3. column_metadata policies – same as worksheets
create policy column_metadata_select on public.column_metadata for select using (
    exists (select 1 from public.worksheets ws join public.user_roles ur on ur.workbook_id = ws.workbook_id
            where ws.id = column_metadata.worksheet_id and ur.user_id = auth.uid() and ur.role in ('owner','editor','viewer'))
);
create policy column_metadata_insert on public.column_metadata for insert with check (
    exists (select 1 from public.worksheets ws join public.user_roles ur on ur.workbook_id = ws.workbook_id
            where ws.id = worksheet_id and ur.user_id = auth.uid() and ur.role = 'owner')
);
create policy column_metadata_update on public.column_metadata for update using (
    exists (select 1 from public.worksheets ws join public.user_roles ur on ur.workbook_id = ws.workbook_id
            where ws.id = worksheet_id and ur.user_id = auth.uid() and ur.role = 'owner')
) with check (
    exists (select 1 from public.worksheets ws join public.user_roles ur on ur.workbook_id = ws.workbook_id
            where ws.id = worksheet_id and ur.user_id = auth.uid() and ur.role = 'owner')
);
create policy column_metadata_delete on public.column_metadata for delete using (
    exists (select 1 from public.worksheets ws join public.user_roles ur on ur.workbook_id = ws.workbook_id
            where ws.id = worksheet_id and ur.user_id = auth.uid() and ur.role = 'owner')
);

-- 4. worksheet_rows policies – same as worksheets
create policy worksheet_rows_select on public.worksheet_rows for select using (
    exists (select 1 from public.worksheets ws join public.user_roles ur on ur.workbook_id = ws.workbook_id
            where ws.id = worksheet_rows.worksheet_id and ur.user_id = auth.uid() and ur.role in ('owner','editor','viewer'))
);
create policy worksheet_rows_insert on public.worksheet_rows for insert with check (
    exists (select 1 from public.worksheets ws join public.user_roles ur on ur.workbook_id = ws.workbook_id
            where ws.id = worksheet_id and ur.user_id = auth.uid() and ur.role in ('owner','editor'))
);
create policy worksheet_rows_update on public.worksheet_rows for update using (
    exists (select 1 from public.worksheets ws join public.user_roles ur on ur.workbook_id = ws.workbook_id
            where ws.id = worksheet_id and ur.user_id = auth.uid() and ur.role in ('owner','editor'))
) with check (
    exists (select 1 from public.worksheets ws join public.user_roles ur on ur.workbook_id = ws.workbook_id
            where ws.id = worksheet_id and ur.user_id = auth.uid() and ur.role in ('owner','editor'))
);
create policy worksheet_rows_delete on public.worksheet_rows for delete using (
    exists (select 1 from public.worksheets ws join public.user_roles ur on ur.workbook_id = ws.workbook_id
            where ws.id = worksheet_id and ur.user_id = auth.uid() and ur.role = 'owner')
);

-- 5. user_roles policies – only owners can manage roles for their workbooks
create policy user_roles_select on public.user_roles for select using (
    exists (select 1 from public.workbooks wb where wb.id = user_roles.workbook_id and wb.owner_id = auth.uid())
);
create policy user_roles_insert on public.user_roles for insert with check (
    exists (select 1 from public.workbooks wb where wb.id = user_roles.workbook_id and wb.owner_id = auth.uid())
);
create policy user_roles_update on public.user_roles for update using (
    exists (select 1 from public.workbooks wb where wb.id = user_roles.workbook_id and wb.owner_id = auth.uid())
) with check (
    exists (select 1 from public.workbooks wb where wb.id = user_roles.workbook_id and wb.owner_id = auth.uid())
);
create policy user_roles_delete on public.user_roles for delete using (
    exists (select 1 from public.workbooks wb where wb.id = user_roles.workbook_id and wb.owner_id = auth.uid())
);

-- 6. audit_logs – users can insert their own logs; owners can select logs for their workbooks
create policy audit_logs_insert on public.audit_logs for insert with check (user_id = auth.uid());
create policy audit_logs_select on public.audit_logs for select using (
    exists (
        select 1 from public.workbooks wb
        join public.user_roles ur on ur.workbook_id = wb.id
        where wb.owner_id = auth.uid() or ur.user_id = auth.uid()
    )
);
