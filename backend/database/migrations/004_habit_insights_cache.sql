-- Migration: Create habit_insights_cache table
-- Purpose: Cache generated insights to avoid repeated Gemini API calls

DROP TABLE IF EXISTS public.habit_insights_cache CASCADE;

CREATE TABLE public.habit_insights_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period text NOT NULL, -- 'weekly', 'monthly', 'yearly', 'overall'
  date_range_start date NOT NULL,
  date_range_end date NOT NULL,
  
  -- Cached analysis results
  days_analyzed integer NOT NULL DEFAULT 0,
  total_meals integer NOT NULL DEFAULT 0,
  average_calories numeric DEFAULT 0,
  
  -- JSON data
  patterns jsonb DEFAULT '[]'::jsonb,
  nutrient_trends jsonb DEFAULT '[]'::jsonb,
  meal_timings jsonb DEFAULT '[]'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  
  -- AI-generated content
  summary text,
  health_score integer DEFAULT 0,
  
  -- Cache metadata
  data_hash text, -- Hash of input data to detect changes
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  
  CONSTRAINT habit_insights_cache_pkey PRIMARY KEY (id),
  CONSTRAINT habit_insights_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Indexes for efficient lookups
CREATE INDEX idx_habit_insights_cache_user_period ON public.habit_insights_cache(user_id, period);
CREATE INDEX idx_habit_insights_cache_expires ON public.habit_insights_cache(expires_at);
CREATE INDEX idx_habit_insights_cache_date_range ON public.habit_insights_cache(user_id, date_range_start, date_range_end);

-- Unique constraint: one cache per user per period per date range
CREATE UNIQUE INDEX unique_habit_insight_cache 
ON public.habit_insights_cache(user_id, period, date_range_start, date_range_end);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_habit_insights()
RETURNS void AS $$
BEGIN
  DELETE FROM public.habit_insights_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE public.habit_insights_cache IS 'Caches habit analysis results to minimize Gemini API calls';
COMMENT ON COLUMN public.habit_insights_cache.data_hash IS 'MD5 hash of aggregated food log data - if unchanged, cache is valid';
COMMENT ON COLUMN public.habit_insights_cache.expires_at IS 'Cache expiry: weekly=1day, monthly=3days, yearly=7days';
