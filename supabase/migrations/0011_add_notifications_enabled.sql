-- Add notifications_enabled field to profiles table
-- This field controls whether the user wants to receive notifications

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.notifications_enabled IS 'Controls whether user receives browser notifications for tasks, habits, and wellness activities';
