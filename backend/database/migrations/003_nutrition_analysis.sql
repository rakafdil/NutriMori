-- Migration: Create nutrition_analysis table
-- This table stores the analysis results of food logs including nutrition facts and health insights
-- 
-- COMPATIBILITY NOTES:
-- - Works with existing food_log_items where food_id can be varchar (UUID or integer string)
-- - Nutrition data sourced from:
--   1. food_nutrients table (for UUID food_ids from food_items)
--   2. food_embeddings.nutrition_data JSONB (for integer food_ids)
-- - One analysis per food_log_id enforced by unique constraint

CREATE TABLE IF NOT EXISTS public.nutrition_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  food_log_id uuid NOT NULL,
  user_id uuid NOT NULL,
  
  -- Basic Nutrition Facts (Macronutrients)
  total_calories numeric DEFAULT 0,
  total_protein numeric DEFAULT 0,
  total_carbs numeric DEFAULT 0,
  total_fat numeric DEFAULT 0,
  total_sugar numeric DEFAULT 0,
  total_fiber numeric DEFAULT 0,
  total_sodium numeric DEFAULT 0,
  total_cholesterol numeric DEFAULT 0,
  
  -- Micronutrients (stored as JSONB for flexibility)
  micronutrients jsonb DEFAULT '{}'::jsonb,
  -- Example: {"vitamin_c": "10%", "iron": "5%", "calcium": "15%"}
  
  -- Health Tags & Insights
  health_tags text[] DEFAULT ARRAY[]::text[],
  -- Example: ["High Protein", "Low Sugar", "Heart Healthy"]
  
  -- Analysis Metadata
  analysis_notes text,
  meets_goals boolean DEFAULT true,
  warnings text[] DEFAULT ARRAY[]::text[],
  -- Example: ["Exceeds daily sodium limit", "Low in fiber"]
  
  -- User Context at time of analysis
  user_daily_target jsonb,
  -- Example: {"calories": 2000, "protein": 50, "carbs": 250, "fat": 70}
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT nutrition_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT nutrition_analysis_food_log_id_fkey FOREIGN KEY (food_log_id) REFERENCES public.food_logs(log_id) ON DELETE CASCADE,
  CONSTRAINT nutrition_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nutrition_analysis_food_log_id ON public.nutrition_analysis(food_log_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_analysis_user_id ON public.nutrition_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_analysis_created_at ON public.nutrition_analysis(created_at);

-- Add unique constraint to ensure one analysis per food log
CREATE UNIQUE INDEX IF NOT EXISTS unique_food_log_analysis ON public.nutrition_analysis(food_log_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_nutrition_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_nutrition_analysis_updated_at
  BEFORE UPDATE ON public.nutrition_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_analysis_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.nutrition_analysis IS 'Stores comprehensive nutrition analysis results for food logs';
COMMENT ON COLUMN public.nutrition_analysis.micronutrients IS 'Flexible JSONB storage for vitamins and minerals data';
COMMENT ON COLUMN public.nutrition_analysis.health_tags IS 'Array of health-related tags generated from analysis';
COMMENT ON COLUMN public.nutrition_analysis.user_daily_target IS 'Snapshot of user nutrition goals at time of analysis';
