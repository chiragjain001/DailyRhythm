-- Fix wellness activities duplication issue
-- Remove wellness_activities table and rely only on wellness_completions for tracking
-- Activities are now generated dynamically in the frontend

-- 1. BACKUP existing completion data from wellness_activities (if any valuable data exists)
-- First, ensure any completion data from wellness_activities is preserved in wellness_completions
INSERT INTO public.wellness_completions (user_id, activity_title, completion_date, created_at)
SELECT DISTINCT 
  wa.user_id,
  wa.title,
  wa.activity_date,
  wa.created_at
FROM public.wellness_activities wa
WHERE wa.completed = true
  AND NOT EXISTS (
    SELECT 1 FROM public.wellness_completions wc 
    WHERE wc.user_id = wa.user_id 
      AND wc.activity_title = wa.title 
      AND wc.completion_date = wa.activity_date
  );

-- 2. DROP wellness_activities table (no longer needed - activities generated dynamically)
DROP TABLE IF EXISTS public.wellness_activities CASCADE;

-- 3. ENSURE wellness_completions table has proper structure and constraints
-- Add unique constraint to prevent duplicates
ALTER TABLE public.wellness_completions 
DROP CONSTRAINT IF EXISTS wellness_completions_unique;

ALTER TABLE public.wellness_completions 
ADD CONSTRAINT wellness_completions_unique 
UNIQUE (user_id, activity_title, completion_date);

-- 4. ENSURE RLS is enabled on wellness_completions
ALTER TABLE public.wellness_completions ENABLE ROW LEVEL SECURITY;

-- 5. CREATE/UPDATE RLS policies for wellness_completions
DROP POLICY IF EXISTS "Users can view own wellness completions" ON public.wellness_completions;
DROP POLICY IF EXISTS "Users can insert own wellness completions" ON public.wellness_completions;
DROP POLICY IF EXISTS "Users can update own wellness completions" ON public.wellness_completions;
DROP POLICY IF EXISTS "Users can delete own wellness completions" ON public.wellness_completions;

CREATE POLICY "Users can view own wellness completions" 
ON public.wellness_completions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness completions" 
ON public.wellness_completions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness completions" 
ON public.wellness_completions FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wellness completions" 
ON public.wellness_completions FOR DELETE 
USING (auth.uid() = user_id);

-- 6. ADD indexes for performance
CREATE INDEX IF NOT EXISTS idx_wellness_completions_user_date 
ON public.wellness_completions (user_id, completion_date);

CREATE INDEX IF NOT EXISTS idx_wellness_completions_date 
ON public.wellness_completions (completion_date);

-- 7. ADD helpful comments
COMMENT ON TABLE public.wellness_completions IS 'Tracks user completion of daily wellness activities. Activities themselves are generated dynamically in the frontend.';
COMMENT ON COLUMN public.wellness_completions.activity_title IS 'Title of the completed wellness activity (activities are generated dynamically, not stored)';
COMMENT ON COLUMN public.wellness_completions.completion_date IS 'Date when the activity was completed (YYYY-MM-DD format)';
