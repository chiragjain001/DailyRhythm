-- Enable required extension for UUID generation
create extension if not exists pgcrypto;

-- Tables
create table if not exists public.agenda (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.wellness_checklist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.agenda enable row level security;
alter table public.habits enable row level security;
alter table public.wellness_checklist enable row level security;

-- Policies: each user can only access their own rows
-- Agenda
create policy if not exists "agenda_select_own" on public.agenda
  for select using (auth.uid() = user_id);
create policy if not exists "agenda_insert_own" on public.agenda
  for insert with check (auth.uid() = user_id);
create policy if not exists "agenda_update_own" on public.agenda
  for update using (auth.uid() = user_id);
create policy if not exists "agenda_delete_own" on public.agenda
  for delete using (auth.uid() = user_id);

-- Habits
create policy if not exists "habits_select_own" on public.habits
  for select using (auth.uid() = user_id);
create policy if not exists "habits_insert_own" on public.habits
  for insert with check (auth.uid() = user_id);
create policy if not exists "habits_update_own" on public.habits
  for update using (auth.uid() = user_id);
create policy if not exists "habits_delete_own" on public.habits
  for delete using (auth.uid() = user_id);

-- Wellness Checklist
create policy if not exists "wellness_select_own" on public.wellness_checklist
  for select using (auth.uid() = user_id);
create policy if not exists "wellness_insert_own" on public.wellness_checklist
  for insert with check (auth.uid() = user_id);
create policy if not exists "wellness_update_own" on public.wellness_checklist
  for update using (auth.uid() = user_id);
create policy if not exists "wellness_delete_own" on public.wellness_checklist
  for delete using (auth.uid() = user_id);
