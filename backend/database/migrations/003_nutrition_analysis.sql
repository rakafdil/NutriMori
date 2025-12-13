DROP TABLE IF EXISTS public.nutrition_analysis CASCADE;

CREATE TABLE public.nutrition_analysis (
  -- Primary key
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  -- food_log_id references log_id from food_log_items table
  food_log_id uuid NOT NULL,
  -- user_id references user_id from user_preferences table
  user_id uuid NOT NULL,
  
  -- Basic Nutrition Facts (Macronutrients) - stored as numeric for calculations
  total_calories numeric NOT NULL DEFAULT 0,
  total_protein numeric NOT NULL DEFAULT 0,
  total_carbs numeric NOT NULL DEFAULT 0,
  total_fat numeric NOT NULL DEFAULT 0,
  total_sugar numeric NOT NULL DEFAULT 0,
  total_fiber numeric DEFAULT 0,
  total_sodium numeric DEFAULT 0,
  total_cholesterol numeric DEFAULT 0,
  
  -- Micronutrients (stored as JSONB for flexibility)
  -- Example: {"vitamin_c": "10%", "iron": "5%", "calcium": "15%"}
  micronutrients jsonb DEFAULT '{}'::jsonb,
  
  -- Health Tags & Insights
  -- Example: ["High Protein", "Low Sugar", "Heart Healthy"]
  health_tags text[] DEFAULT ARRAY[]::text[],
  
  -- Analysis Metadata
  analysis_notes text,
  meets_goals boolean DEFAULT true,
  
  -- Warning messages
  -- Example: ["Exceeds daily sodium limit", "Low in fiber"]
  warnings text[] DEFAULT ARRAY[]::text[],
  
  -- User Context at time of analysis (optional snapshot)
  user_daily_target jsonb,
  -- Example: {"calories": 2000, "protein": 50, "carbs": 250, "fat": 70}
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Constraints
  CONSTRAINT nutrition_analysis_pkey PRIMARY KEY (id)
  -- Note: Foreign key to food_log_items.log_id is not enforced at DB level
  -- because log_id is not unique in food_log_items (multiple items per log)
  -- The application logic handles this relationship
);

-- Create indexes for better query performance
CREATE INDEX idx_nutrition_analysis_food_log_id ON public.nutrition_analysis(food_log_id);
CREATE INDEX idx_nutrition_analysis_user_id ON public.nutrition_analysis(user_id);
CREATE INDEX idx_nutrition_analysis_created_at ON public.nutrition_analysis(created_at DESC);
CREATE INDEX idx_nutrition_analysis_health_tags ON public.nutrition_analysis USING GIN(health_tags);

-- Add unique constraint to ensure one analysis per food log
CREATE UNIQUE INDEX unique_food_log_analysis ON public.nutrition_analysis(food_log_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_nutrition_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_nutrition_analysis_updated_at ON public.nutrition_analysis;
CREATE TRIGGER trigger_update_nutrition_analysis_updated_at
  BEFORE UPDATE ON public.nutrition_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_analysis_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.nutrition_analysis IS 'Stores comprehensive nutrition analysis results for food logs';
COMMENT ON COLUMN public.nutrition_analysis.id IS 'Unique analysis ID (UUID)';
COMMENT ON COLUMN public.nutrition_analysis.food_log_id IS 'Reference to log_id from food_log_items table';
COMMENT ON COLUMN public.nutrition_analysis.user_id IS 'Reference to user_id from user_preferences table';
COMMENT ON COLUMN public.nutrition_analysis.total_calories IS 'Total calories calculated from food items';
COMMENT ON COLUMN public.nutrition_analysis.total_protein IS 'Total protein in grams';
COMMENT ON COLUMN public.nutrition_analysis.total_carbs IS 'Total carbohydrates in grams';
COMMENT ON COLUMN public.nutrition_analysis.total_fat IS 'Total fat in grams';
COMMENT ON COLUMN public.nutrition_analysis.total_sugar IS 'Total sugar in grams';
COMMENT ON COLUMN public.nutrition_analysis.total_fiber IS 'Total fiber in grams';
COMMENT ON COLUMN public.nutrition_analysis.total_sodium IS 'Total sodium in mg';
COMMENT ON COLUMN public.nutrition_analysis.total_cholesterol IS 'Total cholesterol in mg';
COMMENT ON COLUMN public.nutrition_analysis.micronutrients IS 'Flexible JSONB storage for vitamins and minerals data';
COMMENT ON COLUMN public.nutrition_analysis.health_tags IS 'Array of health-related tags generated from analysis';
COMMENT ON COLUMN public.nutrition_analysis.analysis_notes IS 'Human-readable summary and recommendations';
COMMENT ON COLUMN public.nutrition_analysis.meets_goals IS 'Whether the meal meets user nutrition goals';
COMMENT ON COLUMN public.nutrition_analysis.warnings IS 'Array of warning messages for the user';
COMMENT ON COLUMN public.nutrition_analysis.user_daily_target IS 'Snapshot of user nutrition goals at time of analysis';

-- ============================================
-- SAMPLE QUERY: Insert nutrition analysis
-- ============================================
-- This is the query used by the NutritionAnalysisService to save analysis:
--
-- INSERT INTO nutrition_analysis (
--   food_log_id,
--   user_id,
--   total_calories,
--   total_protein,
--   total_carbs,
--   total_fat,
--   total_sugar,
--   total_fiber,
--   total_sodium,
--   total_cholesterol,
--   micronutrients,
--   health_tags,
--   warnings,
--   analysis_notes,
--   meets_goals
-- ) VALUES (
--   '123e4567-e89b-12d3-a456-426614174000', -- food_log_id
--   '123e4567-e89b-12d3-a456-426614174001', -- user_id
--   450,                                     -- total_calories
--   30,                                      -- total_protein
--   50,                                      -- total_carbs
--   15,                                      -- total_fat
--   5,                                       -- total_sugar
--   8,                                       -- total_fiber
--   500,                                     -- total_sodium
--   50,                                      -- total_cholesterol
--   '{"vitamin_c": "10%", "iron": "5%"}'::jsonb, -- micronutrients
--   ARRAY['High Protein', 'Low Sugar'],     -- health_tags
--   ARRAY[]::text[],                         -- warnings (empty)
--   'Total meal contains 450 calories...',   -- analysis_notes
--   true                                     -- meets_goals
-- ) RETURNING *;

-- ============================================
-- SAMPLE QUERY: Get analysis by food_log_id
-- ============================================
-- SELECT * FROM nutrition_analysis 
-- WHERE food_log_id = '123e4567-e89b-12d3-a456-426614174000'
-- AND user_id = '123e4567-e89b-12d3-a456-426614174001';

-- ============================================
-- SAMPLE QUERY: Get user analysis history
-- ============================================
-- SELECT * FROM nutrition_analysis 
-- WHERE user_id = '123e4567-e89b-12d3-a456-426614174001'
-- ORDER BY created_at DESC
-- LIMIT 10;
