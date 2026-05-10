-- Rework profiles schema to match spec: use id as PK (auth.users.id), add bio and profile_completed, trigger on auth.users

-- Rename user_id -> id if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN user_id TO id;
  END IF;
END $$;

-- Ensure primary key is id
DO $$
BEGIN
  -- drop existing pk if named differently
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    -- nothing, assume it is on id already from previous migration
  END IF;
END $$;

-- Add columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;

-- Ensure username column exists and is unique
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
-- Backfill username for nulls before making NOT NULL
UPDATE public.profiles SET username = 'user_' || RIGHT(id::text, 8) WHERE username IS NULL;
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles (username);

-- Policies: drop and recreate using id column
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Trigger: create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_name text;
  last_name text;
  full_name text;
BEGIN
  -- Try to read names from raw_user_meta_data
  first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'given_name');
  last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'family_name');
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name');

  IF first_name IS NULL AND full_name IS NOT NULL THEN
    -- naive split full name
    first_name := split_part(full_name, ' ', 1);
    last_name := NULLIF(substring(full_name from position(' ' in full_name)+1), '');
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, username)
  VALUES (
    NEW.id,
    first_name,
    last_name,
    'user_' || RIGHT(NEW.id::text, 8)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
