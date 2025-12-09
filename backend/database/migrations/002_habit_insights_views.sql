-- Migration: Create helper views and functions for habit insights
-- Description: Provides optimized queries for food log analysis with aggregated nutrients

-- ============================================================================
-- View: user_food_logs_with_nutrients
-- Purpose: Materialized view for fast habit insights queries with pre-calculated nutrients
-- ============================================================================

CREATE OR REPLACE VIEW user_food_logs_with_nutrients AS
SELECT 
    fl.log_id,
    fl.user_id,
    fl.raw_text,
    fl.meal_type,
    fl.created_at,
    fl.parsed_by_llm,
    -- Aggregate nutrients from all items in this log
    json_build_object(
        'calories', COALESCE(SUM(fn.calories * (fli.gram_weight / NULLIF(fi.serving_size, 0))), 0),
        'protein', COALESCE(SUM(fn.protein * (fli.gram_weight / NULLIF(fi.serving_size, 0))), 0),
        'carbs', COALESCE(SUM(fn.carbs * (fli.gram_weight / NULLIF(fi.serving_size, 0))), 0),
        'fat', COALESCE(SUM(fn.fat * (fli.gram_weight / NULLIF(fi.serving_size, 0))), 0),
        'sugar', COALESCE(SUM(fn.sugar * (fli.gram_weight / NULLIF(fi.serving_size, 0))), 0),
        'sodium', COALESCE(SUM(fn.sodium * (fli.gram_weight / NULLIF(fi.serving_size, 0))), 0),
        'fiber', COALESCE(SUM(fn.fiber * (fli.gram_weight / NULLIF(fi.serving_size, 0))), 0),
        'cholesterol', COALESCE(SUM(fn.cholesterol * (fli.gram_weight / NULLIF(fi.serving_size, 0))), 0)
    ) as nutrients,
    -- Aggregate food items details
    json_agg(
        json_build_object(
            'item_id', fli.item_id,
            'detected_name', fli.detected_name,
            'food_id', fli.food_id,
            'food_name', fi.name,
            'brand', fi.brand,
            'qty', fli.qty,
            'unit', fli.unit,
            'gram_weight', fli.gram_weight,
            'confidence_score', fli.confidence_score
        )
    ) as items,
    -- Aggregate categories
    array_agg(DISTINCT fc.category) FILTER (WHERE fc.category IS NOT NULL) as categories
FROM food_logs fl
LEFT JOIN food_log_items fli ON fl.log_id = fli.log_id
LEFT JOIN food_items fi ON fli.food_id = fi.id
LEFT JOIN food_nutrients fn ON fi.id = fn.food_id
LEFT JOIN food_categories fc ON fi.id = fc.food_id
GROUP BY fl.log_id, fl.user_id, fl.raw_text, fl.meal_type, fl.created_at, fl.parsed_by_llm;

-- ============================================================================
-- Function: get_user_habit_stats
-- Purpose: Calculate habit statistics for a user over a date range
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_habit_stats(
    p_user_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    total_logs INTEGER,
    unique_days INTEGER,
    avg_calories_per_day NUMERIC,
    avg_meals_per_day NUMERIC,
    total_calories NUMERIC,
    total_protein NUMERIC,
    total_carbs NUMERIC,
    total_fat NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH log_data AS (
        SELECT 
            fl.log_id,
            DATE(fl.created_at) as log_date,
            fn.calories * (fli.gram_weight / NULLIF(fi.serving_size, 0)) as calories,
            fn.protein * (fli.gram_weight / NULLIF(fi.serving_size, 0)) as protein,
            fn.carbs * (fli.gram_weight / NULLIF(fi.serving_size, 0)) as carbs,
            fn.fat * (fli.gram_weight / NULLIF(fi.serving_size, 0)) as fat
        FROM food_logs fl
        LEFT JOIN food_log_items fli ON fl.log_id = fli.log_id
        LEFT JOIN food_items fi ON fli.food_id = fi.id
        LEFT JOIN food_nutrients fn ON fi.id = fn.food_id
        WHERE fl.user_id = p_user_id
            AND fl.created_at >= p_start_date
            AND fl.created_at <= p_end_date
    ),
    daily_stats AS (
        SELECT 
            COUNT(DISTINCT log_id) as daily_logs,
            SUM(calories) as daily_calories
        FROM log_data
        GROUP BY log_date
    )
    SELECT 
        COUNT(DISTINCT ld.log_id)::INTEGER as total_logs,
        COUNT(DISTINCT ld.log_date)::INTEGER as unique_days,
        COALESCE(AVG(ds.daily_calories), 0)::NUMERIC(10,2) as avg_calories_per_day,
        COALESCE(AVG(ds.daily_logs), 0)::NUMERIC(10,2) as avg_meals_per_day,
        COALESCE(SUM(ld.calories), 0)::NUMERIC(10,2) as total_calories,
        COALESCE(SUM(ld.protein), 0)::NUMERIC(10,2) as total_protein,
        COALESCE(SUM(ld.carbs), 0)::NUMERIC(10,2) as total_carbs,
        COALESCE(SUM(ld.fat), 0)::NUMERIC(10,2) as total_fat
    FROM log_data ld
    CROSS JOIN daily_stats ds;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: detect_breakfast_skipping
-- Purpose: Identify days when user skipped breakfast
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_breakfast_skipping(
    p_user_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    date DATE,
    has_breakfast BOOLEAN,
    first_meal_time TIME
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_logs AS (
        SELECT 
            DATE(created_at) as log_date,
            MIN(created_at) as first_meal
        FROM food_logs
        WHERE user_id = p_user_id
            AND created_at >= p_start_date
            AND created_at <= p_end_date
        GROUP BY DATE(created_at)
    ),
    all_dates AS (
        SELECT generate_series(
            DATE(p_start_date),
            DATE(p_end_date),
            '1 day'::interval
        )::DATE as check_date
    )
    SELECT 
        ad.check_date as date,
        CASE 
            WHEN dl.first_meal IS NULL THEN FALSE
            WHEN EXTRACT(HOUR FROM dl.first_meal) <= 10 THEN TRUE
            ELSE FALSE
        END as has_breakfast,
        CASE 
            WHEN dl.first_meal IS NULL THEN NULL
            ELSE dl.first_meal::TIME
        END as first_meal_time
    FROM all_dates ad
    LEFT JOIN daily_logs dl ON ad.check_date = dl.log_date
    ORDER BY ad.check_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Index Optimizations for Habit Insights Queries
-- ============================================================================

-- Speed up user-based queries
CREATE INDEX IF NOT EXISTS idx_food_logs_user_created 
ON food_logs(user_id, created_at DESC);

-- Speed up date range queries
CREATE INDEX IF NOT EXISTS idx_food_logs_created_at 
ON food_logs(created_at);

-- Speed up meal type analysis
CREATE INDEX IF NOT EXISTS idx_food_logs_meal_type 
ON food_logs(meal_type);

-- Speed up food log items lookups
CREATE INDEX IF NOT EXISTS idx_food_log_items_log_id 
ON food_log_items(log_id);

-- Speed up food items lookups
CREATE INDEX IF NOT EXISTS idx_food_log_items_food_id 
ON food_log_items(food_id);

-- Speed up category lookups
CREATE INDEX IF NOT EXISTS idx_food_categories_food_id 
ON food_categories(food_id);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON VIEW user_food_logs_with_nutrients IS 
'Aggregated view of food logs with calculated nutrients from all items. 
Used by habit insights service for pattern analysis.';

COMMENT ON FUNCTION get_user_habit_stats IS 
'Calculate comprehensive habit statistics for a user over a date range.
Returns total logs, unique days, average calories/meals per day, and total macros.';

COMMENT ON FUNCTION detect_breakfast_skipping IS 
'Detect days when user skipped breakfast (first meal after 10 AM or no meals).
Returns daily breakfast status for the specified date range.';
