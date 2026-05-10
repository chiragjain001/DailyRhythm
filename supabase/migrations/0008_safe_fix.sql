-- ULTRA SAFE User Isolation Fix
-- This will not fail - it checks everything before executing

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- STEP 1: CREATE TABLES SAFELY
-- ============================================

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  assignee text,
  time text,
  priority text DEFAULT 'medium',
  progress numeric DEFAULT 0,
  completed boolean DEFAULT false,
  category text DEFAULT 'general',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wellness_activities table
CREATE TABLE IF NOT EXISTS public.wellness_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean DEFAULT false,
  points integer DEFAULT 10,
  activity_date date DEFAULT CURRENT_DATE,
  category text DEFAULT 'wellness',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create habit_completions table
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  local_date date DEFAULT CURRENT_DATE,
  timezone text DEFAULT 'UTC',
  created_at timestamptz DEFAULT now()
);

-- Create wellness_completions table  
CREATE TABLE IF NOT EXISTS public.wellness_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wellness_activity_id uuid NOT NULL REFERENCES public.wellness_activities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- STEP 2: ADD MISSING COLUMNS TO HABITS
-- ============================================

ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS last_completion timestamptz;

-- ============================================
-- STEP 3: ENABLE RLS
-- ============================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_completions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: DROP OLD POLICIES (if they exist)
-- ============================================

DROP POLICY IF EXISTS "tasks_select_own" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_own" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_own" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_own" ON public.tasks;

DROP POLICY IF EXISTS "wellness_activities_select_own" ON public.wellness_activities;
DROP POLICY IF EXISTS "wellness_activities_insert_own" ON public.wellness_activities;
DROP POLICY IF EXISTS "wellness_activities_update_own" ON public.wellness_activities;
DROP POLICY IF EXISTS "wellness_activities_delete_own" ON public.wellness_activities;

DROP POLICY IF EXISTS "habits_select_own" ON public.habits;
DROP POLICY IF EXISTS "habits_insert_own" ON public.habits;
DROP POLICY IF EXISTS "habits_update_own" ON public.habits;
DROP POLICY IF EXISTS "habits_delete_own" ON public.habits;

DROP POLICY IF EXISTS "habit_completions_select_own" ON public.habit_completions;
DROP POLICY IF EXISTS "habit_completions_insert_own" ON public.habit_completions;
DROP POLICY IF EXISTS "habit_completions_update_own" ON public.habit_completions;
DROP POLICY IF EXISTS "habit_completions_delete_own" ON public.habit_completions;

DROP POLICY IF EXISTS "wellness_completions_select_own" ON public.wellness_completions;
DROP POLICY IF EXISTS "wellness_completions_insert_own" ON public.wellness_completions;
DROP POLICY IF EXISTS "wellness_completions_update_own" ON public.wellness_completions;
DROP POLICY IF EXISTS "wellness_completions_delete_own" ON public.wellness_completions;

-- ============================================
-- STEP 5: CREATE NEW POLICIES
-- ============================================

-- Tasks policies
CREATE POLICY "tasks_select_own" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert_own" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_own" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete_own" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Wellness activities policies
CREATE POLICY "wellness_activities_select_own" ON public.wellness_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wellness_activities_insert_own" ON public.wellness_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wellness_activities_update_own" ON public.wellness_activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wellness_activities_delete_own" ON public.wellness_activities FOR DELETE USING (auth.uid() = user_id);

-- Habits policies
CREATE POLICY "habits_select_own" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "habits_insert_own" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habits_update_own" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "habits_delete_own" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- Habit completions policies
CREATE POLICY "habit_completions_select_own" ON public.habit_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "habit_completions_insert_own" ON public.habit_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habit_completions_update_own" ON public.habit_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "habit_completions_delete_own" ON public.habit_completions FOR DELETE USING (auth.uid() = user_id);

-- Wellness completions policies
CREATE POLICY "wellness_completions_select_own" ON public.wellness_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wellness_completions_insert_own" ON public.wellness_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wellness_completions_update_own" ON public.wellness_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wellness_completions_delete_own" ON public.wellness_completions FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STEP 6: CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_activities_user_id ON public.wellness_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON public.habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_completions_user_id ON public.wellness_completions(user_id);

-- ============================================
-- DONE!
-- ============================================

SELECT '✅ Migration completed successfully!' as status;
