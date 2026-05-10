-- Profiles table for user metadata
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies: user can access only their own profile
create policy if not exists "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);
create policy if not exists "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy if not exists "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);
create policy if not exists "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = user_id);

-- Storage bucket for avatars (public read)
-- Prefer using storage.create_bucket; fallback insert if not available
do $$
begin
  perform storage.create_bucket('avatars', public => true);
exception when undefined_function then
  insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
end $$;

-- Storage policies
create policy if not exists "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy if not exists "avatars_authenticated_upload" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy if not exists "avatars_update_own" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid() = owner);

create policy if not exists "avatars_delete_own" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid() = owner);
