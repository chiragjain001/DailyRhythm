-- Add time column to habits table
-- This migration adds a time field to store when the habit should be performed

-- Add time column to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS time TEXT;

-- Update existing habits to have a default time if they don't have one
UPDATE habits 
SET time = '9:00 AM' 
WHERE time IS NULL OR time = '';

-- Add comment to document the column
COMMENT ON COLUMN habits.time IS 'Time when the habit should be performed (e.g., "9:00 AM")';
