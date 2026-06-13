-- FlowDay cloud schema. Run in the Supabase SQL editor (or `supabase db push`).
-- Single-row-per-user state blob keeps sync trivial and reliable.

create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  state       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user can only read/write their own row.
drop policy if exists "profiles are self-owned" on public.profiles;
create policy "profiles are self-owned"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);
