-- Create a table for storing AI insights/analysis
create table if not exists insights (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table insights enable row level security;

-- Policy: Users can view their own insights
create policy "Users can view their own insights"
  on insights for select
  using (auth.uid() = user_id);

-- Policy: Service role can manage all insights (for the daily job)
-- (Service role bypasses RLS by default, but good to be explicit if needed, usually not for service role)
