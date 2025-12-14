-- Migration: Create nutrition_limits table
-- Description: Store calculated nutrition limits from LLM to avoid repeated calculations
-- Run this migration on your Supabase database

-- Create nutrition_limits table
CREATE TABLE IF NOT EXISTS public.nutrition_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  max_calories numeric NOT NULL,
  max_protein numeric NOT NULL,
  max_carbs numeric NOT NULL,
  max_fat numeric NOT NULL,
  max_sugar numeric,
  max_fiber numeric,
  max_sodium numeric,
  max_cholesterol numeric,
  explanation text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nutrition_limits_pkey PRIMARY KEY (id),
  CONSTRAINT nutrition_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Add comments for documentation
COMMENT ON TABLE public.nutrition_limits IS 'Stores AI-calculated daily nutrition limits for each user';
COMMENT ON COLUMN public.nutrition_limits.user_id IS 'Reference to the user who owns these limits';
COMMENT ON COLUMN public.nutrition_limits.max_calories IS 'Maximum daily calories (kcal) calculated by AI based on user profile';
COMMENT ON COLUMN public.nutrition_limits.max_protein IS 'Maximum daily protein (g) calculated by AI based on user profile';
COMMENT ON COLUMN public.nutrition_limits.max_carbs IS 'Maximum daily carbohydrates (g) calculated by AI based on user profile';
COMMENT ON COLUMN public.nutrition_limits.max_fat IS 'Maximum daily fat (g) calculated by AI based on user profile';
COMMENT ON COLUMN public.nutrition_limits.max_sugar IS 'Maximum daily sugar (g) calculated by AI based on user profile';
COMMENT ON COLUMN public.nutrition_limits.max_fiber IS 'Maximum daily fiber (g) calculated by AI based on user profile';
COMMENT ON COLUMN public.nutrition_limits.max_sodium IS 'Maximum daily sodium (mg) calculated by AI based on user profile';
COMMENT ON COLUMN public.nutrition_limits.max_cholesterol IS 'Maximum daily cholesterol (mg) calculated by AI based on user profile';
COMMENT ON COLUMN public.nutrition_limits.explanation IS 'AI explanation of how the limits were calculated';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_nutrition_limits_user_id 
ON public.nutrition_limits(user_id);

CREATE INDEX IF NOT EXISTS idx_nutrition_limits_updated_at 
ON public.nutrition_limits(updated_at);

-- NOTE: RLS Policies for this table are defined in 005_rls_policies.sql
-- Run that migration after creating this table to enable security policies

-- Verify the table was created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'nutrition_limits'
ORDER BY ordinal_position;
