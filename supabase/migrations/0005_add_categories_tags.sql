-- Add categories and tags support to existing tables
-- This extends the current schema without breaking existing functionality

-- Add category and tags columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add category and tags columns to habits table  
ALTER TABLE public.habits
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add category and tags columns to wellness_activities table
ALTER TABLE public.wellness_activities
ADD COLUMN IF NOT EXISTS category text DEFAULT 'wellness',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create indexes for better performance on category and tags queries
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON public.tasks USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_habits_category ON public.habits(category);
CREATE INDEX IF NOT EXISTS idx_habits_tags ON public.habits USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_wellness_category ON public.wellness_activities(category);
CREATE INDEX IF NOT EXISTS idx_wellness_tags ON public.wellness_activities USING GIN(tags);

-- Create a categories reference table for consistency
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text DEFAULT '#6B7280',
  icon text DEFAULT 'folder',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default categories
INSERT INTO public.categories (name, color, icon) VALUES
  ('general', '#6B7280', 'folder'),
  ('work', '#3B82F6', 'briefcase'),
  ('personal', '#10B981', 'user'),
  ('health', '#EF4444', 'heart'),
  ('learning', '#8B5CF6', 'book'),
  ('wellness', '#F59E0B', 'sun')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for categories (read-only for all authenticated users)
CREATE POLICY "Anyone can view categories" 
ON public.categories FOR SELECT 
USING (true);

-- Create a function to get popular tags for a user
CREATE OR REPLACE FUNCTION get_user_tags(user_uuid uuid)
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT ARRAY(
    SELECT DISTINCT unnest(tags) as tag
    FROM (
      SELECT tags FROM public.tasks WHERE user_id = user_uuid AND tags IS NOT NULL
      UNION ALL
      SELECT tags FROM public.habits WHERE user_id = user_uuid AND tags IS NOT NULL
      UNION ALL
      SELECT tags FROM public.wellness_activities WHERE user_id = user_uuid AND tags IS NOT NULL
    ) combined
    WHERE array_length(tags, 1) > 0
    ORDER BY tag
    LIMIT 50
  );
$$;
