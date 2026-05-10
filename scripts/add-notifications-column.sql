-- Manual script to add notifications_enabled column to profiles table
-- Run this in your Supabase SQL editor if the migration hasn't been applied

-- Add notifications_enabled field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.notifications_enabled IS 'Controls whether user receives browser notifications for tasks, habits, and wellness activities';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'notifications_enabled';
