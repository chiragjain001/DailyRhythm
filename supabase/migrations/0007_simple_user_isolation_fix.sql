-- Simple User Data Isolation Fix
-- This creates missing tables and RLS policies without migrating old data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. CREATE MISSING TABLES

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  assignee text,
  time text,
  priority text NOT NULL DEFAULT 'medium',
  progress numeric DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
  completed boolean DEFAULT false,
  category text DEFAULT 'general',
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create wellness_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wellness_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean DEFAULT false,
  points integer DEFAULT 10,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  category text DEFAULT 'wellness',
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update habits table structure (add columns if they don't exist)
ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS note text,
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_completion timestamp with time zone;

-- Create habit_completions table
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  local_date date NOT NULL DEFAULT CURRENT_DATE,
  completion_date date NOT NULL DEFAULT CURRENT_DATE,
  timezone text DEFAULT 'UTC',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(habit_id, local_date)
);

-- Create wellness_completions table
CREATE TABLE IF NOT EXISTS public.wellness_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wellness_activity_id uuid NOT NULL REFERENCES public.wellness_activities(id) ON DELETE CASCADE,
  completion_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(wellness_activity_id, completion_date)
);

-- 2. ENABLE ROW LEVEL SECURITY

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- 3. CREATE RLS POLICIES

-- Tasks policies
DROP POLICY IF EXISTS "tasks_select_own" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_own" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_own" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_own" ON public.tasks;

CREATE POLICY "tasks_select_own" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert_own" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_own" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_delete_own" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Wellness activities policies
DROP POLICY IF EXISTS "wellness_activities_select_own" ON public.wellness_activities;
DROP POLICY IF EXISTS "wellness_activities_insert_own" ON public.wellness_activities;
DROP POLICY IF EXISTS "wellness_activities_update_own" ON public.wellness_activities;
DROP POLICY IF EXISTS "wellness_activities_delete_own" ON public.wellness_activities;

CREATE POLICY "wellness_activities_select_own" ON public.wellness_activities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wellness_activities_insert_own" ON public.wellness_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wellness_activities_update_own" ON public.wellness_activities
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wellness_activities_delete_own" ON public.wellness_activities
  FOR DELETE USING (auth.uid() = user_id);

-- Habits policies
DROP POLICY IF EXISTS "habits_select_own" ON public.habits;
DROP POLICY IF EXISTS "habits_insert_own" ON public.habits;
DROP POLICY IF EXISTS "habits_update_own" ON public.habits;
DROP POLICY IF EXISTS "habits_delete_own" ON public.habits;

CREATE POLICY "habits_select_own" ON public.habits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "habits_insert_own" ON public.habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habits_update_own" ON public.habits
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habits_delete_own" ON public.habits
  FOR DELETE USING (auth.uid() = user_id);

-- Habit completions policies
DROP POLICY IF EXISTS "habit_completions_select_own" ON public.habit_completions;
DROP POLICY IF EXISTS "habit_completions_insert_own" ON public.habit_completions;
DROP POLICY IF EXISTS "habit_completions_update_own" ON public.habit_completions;
DROP POLICY IF EXISTS "habit_completions_delete_own" ON public.habit_completions;

CREATE POLICY "habit_completions_select_own" ON public.habit_completions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "habit_completions_insert_own" ON public.habit_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habit_completions_update_own" ON public.habit_completions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habit_completions_delete_own" ON public.habit_completions
  FOR DELETE USING (auth.uid() = user_id);

-- Wellness completions policies
DROP POLICY IF EXISTS "wellness_completions_select_own" ON public.wellness_completions;
DROP POLICY IF EXISTS "wellness_completions_insert_own" ON public.wellness_completions;
DROP POLICY IF EXISTS "wellness_completions_update_own" ON public.wellness_completions;
DROP POLICY IF EXISTS "wellness_completions_delete_own" ON public.wellness_completions;

CREATE POLICY "wellness_completions_select_own" ON public.wellness_completions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wellness_completions_insert_own" ON public.wellness_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wellness_completions_update_own" ON public.wellness_completions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wellness_completions_delete_own" ON public.wellness_completions
  FOR DELETE USING (auth.uid() = user_id);

-- 4. CREATE INDEXES FOR PERFORMANCE

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);

CREATE INDEX IF NOT EXISTS idx_wellness_activities_user_id ON public.wellness_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_activities_date ON public.wellness_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_wellness_activities_completed ON public.wellness_activities(completed);

CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON public.habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON public.habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON public.habit_completions(completion_date);

CREATE INDEX IF NOT EXISTS idx_wellness_completions_user_id ON public.wellness_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_completions_activity_id ON public.wellness_completions(wellness_activity_id);
CREATE INDEX IF NOT EXISTS idx_wellness_completions_date ON public.wellness_completions(completion_date);

-- 5. CREATE TRIGGERS FOR UPDATED_AT

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_wellness_activities_updated_at ON public.wellness_activities;
CREATE TRIGGER update_wellness_activities_updated_at
  BEFORE UPDATE ON public.wellness_activities
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 6. CLEAN UP ORPHANED DATA

DELETE FROM public.tasks WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.wellness_activities WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.habits WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.habit_completions WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.wellness_completions WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM auth.users);

-- 7. ADD CONSTRAINTS

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_priority_check 
  CHECK (priority IN ('low', 'medium', 'high'));

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_progress_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_progress_check 
  CHECK (progress >= 0 AND progress <= 1);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ User isolation fix completed successfully!';
  RAISE NOTICE '✅ All tables now have RLS enabled';
  RAISE NOTICE '✅ User data is properly isolated';
  RAISE NOTICE '✅ Run the verification script to confirm';
END $$;
