-- Add task_completions table for historical tracking and analytics
-- This enables graphs and completion trends

-- Create task_completions table
CREATE TABLE IF NOT EXISTS public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now() NOT NULL,
  completion_date date DEFAULT CURRENT_DATE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "task_completions_select_own" ON public.task_completions;
DROP POLICY IF EXISTS "task_completions_insert_own" ON public.task_completions;
DROP POLICY IF EXISTS "task_completions_delete_own" ON public.task_completions;

CREATE POLICY "task_completions_select_own" ON public.task_completions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "task_completions_insert_own" ON public.task_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "task_completions_delete_own" ON public.task_completions
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_completions_user_id ON public.task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON public.task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_date ON public.task_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_task_completions_completed_at ON public.task_completions(completed_at);

-- Create function to automatically log task completions
CREATE OR REPLACE FUNCTION log_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a task is marked as completed, log it
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    INSERT INTO public.task_completions (user_id, task_id, completed_at, completion_date)
    VALUES (NEW.user_id, NEW.id, now(), CURRENT_DATE)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- When a task is marked as incomplete, remove the completion log
  IF NEW.completed = false AND OLD.completed = true THEN
    DELETE FROM public.task_completions 
    WHERE task_id = NEW.id 
    AND completion_date = CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log completions
DROP TRIGGER IF EXISTS task_completion_logger ON public.tasks;
CREATE TRIGGER task_completion_logger
  AFTER UPDATE OF completed ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_completion();

-- Migrate existing completed tasks to task_completions
INSERT INTO public.task_completions (user_id, task_id, completed_at, completion_date)
SELECT 
  user_id, 
  id as task_id, 
  COALESCE(updated_at, created_at) as completed_at,
  COALESCE(updated_at::date, created_at::date) as completion_date
FROM public.tasks
WHERE completed = true
ON CONFLICT DO NOTHING;

-- Success message
SELECT '✅ task_completions table created' as status;
SELECT '✅ Automatic logging enabled' as status;
SELECT '✅ Historical data migrated' as status;
SELECT '✅ Graphs and analytics will now work!' as status;
