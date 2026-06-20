-- RLS policies for dashboard_widgets table
-- Note: This project uses custom authentication (public.users table with text IDs)
-- RLS policies would require a custom function to get the current user ID from session
-- For now, the service layer handles user filtering

-- Enable RLS on dashboard_widgets
alter table public.dashboard_widgets enable row level security;

-- Allow select on dashboard_widgets (service layer enforces user filtering)
create policy dashboard_widgets_select on public.dashboard_widgets 
  for select using (true);

-- Allow insert on dashboard_widgets (service layer validates permissions)
create policy dashboard_widgets_insert on public.dashboard_widgets 
  for insert with check (true);

-- Allow update on dashboard_widgets
create policy dashboard_widgets_update on public.dashboard_widgets 
  for update using (true) with check (true);

-- Allow delete on dashboard_widgets
create policy dashboard_widgets_delete on public.dashboard_widgets 
  for delete using (true);