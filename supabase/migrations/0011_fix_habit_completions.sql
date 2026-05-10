-- Fix habit completions functionality
-- This migration creates the missing RPC functions and fixes query issues

-- 1. CREATE RPC FUNCTION TO MARK HABIT COMPLETION
CREATE OR REPLACE FUNCTION public.rpc_mark_habit_completion(hid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  habit_record record;
  completion_record record;
  new_streak integer;
  result json;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get habit details
  SELECT * INTO habit_record 
  FROM public.habits 
  WHERE id = hid AND user_id = current_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Habit not found or access denied';
  END IF;

  -- Check if already completed today
  SELECT * INTO completion_record
  FROM public.habit_completions
  WHERE habit_id = hid AND local_date = CURRENT_DATE;
  
  IF FOUND THEN
    -- Already completed today, return current data
    result := json_build_object(
      'success', true,
      'message', 'Already completed today',
      'current_streak', habit_record.current_streak,
      'already_completed', true
    );
    RETURN result;
  END IF;

  -- Calculate new streak
  -- Check if completed yesterday to maintain streak
  IF EXISTS (
    SELECT 1 FROM public.habit_completions 
    WHERE habit_id = hid AND local_date = CURRENT_DATE - INTERVAL '1 day'
  ) THEN
    new_streak := habit_record.current_streak + 1;
  ELSE
    new_streak := 1; -- Start new streak
  END IF;

  -- Insert completion record
  INSERT INTO public.habit_completions (user_id, habit_id, local_date, completion_date, timezone)
  VALUES (current_user_id, hid, CURRENT_DATE, CURRENT_DATE, COALESCE(habit_record.timezone, 'UTC'));

  -- Update habit streak
  UPDATE public.habits 
  SET 
    current_streak = new_streak,
    longest_streak = GREATEST(longest_streak, new_streak),
    last_completion = NOW()
  WHERE id = hid AND user_id = current_user_id;

  -- Return success result
  result := json_build_object(
    'success', true,
    'message', 'Habit marked as completed',
    'current_streak', new_streak,
    'already_completed', false
  );
  
  RETURN result;
END;
$$;

-- 2. CREATE RPC FUNCTION TO UNMARK HABIT COMPLETION
CREATE OR REPLACE FUNCTION public.rpc_unmark_habit_completion(hid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  habit_record record;
  completion_record record;
  new_streak integer;
  result json;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get habit details
  SELECT * INTO habit_record 
  FROM public.habits 
  WHERE id = hid AND user_id = current_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Habit not found or access denied';
  END IF;

  -- Check if completed today
  SELECT * INTO completion_record
  FROM public.habit_completions
  WHERE habit_id = hid AND local_date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    -- Not completed today, return current data
    result := json_build_object(
      'success', true,
      'message', 'Not completed today',
      'current_streak', habit_record.current_streak,
      'was_completed', false
    );
    RETURN result;
  END IF;

  -- Delete completion record
  DELETE FROM public.habit_completions
  WHERE habit_id = hid AND local_date = CURRENT_DATE;

  -- Calculate new streak (reduce by 1, but don't go below 0)
  new_streak := GREATEST(0, habit_record.current_streak - 1);

  -- Update habit streak
  UPDATE public.habits 
  SET current_streak = new_streak
  WHERE id = hid AND user_id = current_user_id;

  -- Return success result
  result := json_build_object(
    'success', true,
    'message', 'Habit completion removed',
    'current_streak', new_streak,
    'was_completed', true
  );
  
  RETURN result;
END;
$$;

-- 3. CREATE HELPER FUNCTION TO CHECK IF HABIT IS COMPLETED TODAY
CREATE OR REPLACE FUNCTION public.rpc_is_habit_completed_today(hid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if habit is completed today
  RETURN EXISTS (
    SELECT 1 
    FROM public.habit_completions hc
    JOIN public.habits h ON h.id = hc.habit_id
    WHERE hc.habit_id = hid 
      AND hc.local_date = CURRENT_DATE
      AND h.user_id = current_user_id
  );
END;
$$;

-- 4. GRANT EXECUTE PERMISSIONS TO AUTHENTICATED USERS
GRANT EXECUTE ON FUNCTION public.rpc_mark_habit_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_unmark_habit_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_is_habit_completed_today(uuid) TO authenticated;

-- 5. ADD COMMENTS FOR DOCUMENTATION
COMMENT ON FUNCTION public.rpc_mark_habit_completion(uuid) IS 'Mark a habit as completed for today and update streak';
COMMENT ON FUNCTION public.rpc_unmark_habit_completion(uuid) IS 'Remove habit completion for today and update streak';
COMMENT ON FUNCTION public.rpc_is_habit_completed_today(uuid) IS 'Check if a habit is completed today for the current user';








