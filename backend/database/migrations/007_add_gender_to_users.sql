-- Migration: Add gender column to users table
-- Description: Add gender field for nutrition calculation
-- Run this migration on your Supabase database

-- Add gender column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS gender text;

-- Add comment for documentation
COMMENT ON COLUMN public.users.gender IS 'User gender (male/female) for nutrition calculation';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name = 'gender';
