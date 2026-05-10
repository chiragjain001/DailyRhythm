-- Enable real-time subscriptions for all completion tracking tables
-- This script is idempotent and can be run multiple times safely.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
    RAISE NOTICE 'Enabled real-time for tasks table.';
  ELSE
    RAISE NOTICE 'Real-time for tasks table already enabled.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'habits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE habits;
    RAISE NOTICE 'Enabled real-time for habits table.';
  ELSE
    RAISE NOTICE 'Real-time for habits table already enabled.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'habit_completions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE habit_completions;
    RAISE NOTICE 'Enabled real-time for habit_completions table.';
  ELSE
    RAISE NOTICE 'Real-time for habit_completions table already enabled.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'wellness_completions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wellness_completions;
    RAISE NOTICE 'Enabled real-time for wellness_completions table.';
  ELSE
    RAISE NOTICE 'Real-time for wellness_completions table already enabled.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'wellness_checklist'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wellness_checklist;
    RAISE NOTICE 'Enabled real-time for wellness_checklist table.';
  ELSE
    RAISE NOTICE 'Real-time for wellness_checklist table already enabled.';
  END IF;
END $$;

-- Verify real-time is enabled (for debugging)
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('tasks', 'habits', 'habit_completions', 'wellness_completions', 'wellness_checklist');
