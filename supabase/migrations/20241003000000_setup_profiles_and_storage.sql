-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  first_name text,
  last_name text,
  avatar_url text,
  bio text,
  profile_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies for profiles
create policy "Public profiles are viewable by everyone." 
on profiles for select 
using (true);

create policy "Users can insert their own profile." 
on profiles for insert 
with check (auth.uid() = id);

create policy "Users can update own profile." 
on profiles for update 
using (auth.uid() = id);

-- Create storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set up storage policies for avatars
create policy "Avatar images are publicly accessible" 
on storage.objects 
for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar" 
on storage.objects 
for insert with check (bucket_id = 'avatars');

create policy "Users can update their own avatar" 
on storage.objects 
for update using (auth.uid() = owner) with check (bucket_id = 'avatars');

-- Function to handle new user signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username, created_at, updated_at)
  values (
    new.id, 
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'username', ' '), ''),
      'user' || substr(md5(random()::text), 1, 8)
    ),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on profile updates
create or replace trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();
