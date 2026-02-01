-- ================================================
-- Migration: 008_budget_rules.sql
-- Description: Create food_prices table and optional budget_rules table
-- Author: NutriMori Team
-- Date: 2026-01-31
-- ================================================

-- ============ FOOD PRICES TABLE (REQUIRED) ============
-- This table stores food prices for budget analysis
-- Parent data comes from user_preferences.daily_budget

CREATE TABLE IF NOT EXISTS public.food_prices (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    food_id bigint NOT NULL,
    price_per_100g numeric NOT NULL DEFAULT 0,
    price_per_serving numeric,
    serving_size_g numeric DEFAULT 100,
    price_source text DEFAULT 'estimated', -- 'manual', 'api', 'estimated'
    region text DEFAULT 'Indonesia',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT food_prices_pkey PRIMARY KEY (id),
    CONSTRAINT food_prices_food_id_key UNIQUE (food_id),
    CONSTRAINT food_prices_food_id_fkey FOREIGN KEY (food_id) 
        REFERENCES public.food_items(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_food_prices_food_id ON public.food_prices(food_id);

-- Comment
COMMENT ON TABLE public.food_prices IS 'Stores food prices for budget analysis. Used by nutrition-analysis and habit-insights services.';

-- ============ BUDGET RULES TABLE (OPTIONAL) ============
-- This table is optional - only create if you want customizable budget rules
-- If not needed, the hardcoded rules in nutrition-analysis.service.ts are sufficient

CREATE TABLE IF NOT EXISTS public.budget_rules (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    rule_name text NOT NULL,
    description text,
    min_daily_budget numeric, -- Minimum budget to apply this rule (IDR)
    max_daily_budget numeric, -- Maximum budget to apply this rule (IDR)
    meal_period text, -- 'breakfast', 'lunch', 'dinner', 'snack' or NULL for all
    budget_percentage numeric, -- Suggested percentage allocation
    severity text DEFAULT 'info', -- 'info', 'warning', 'critical'
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT budget_rules_pkey PRIMARY KEY (id),
    CONSTRAINT budget_rules_meal_period_check CHECK (
        meal_period IS NULL OR 
        meal_period IN ('breakfast', 'lunch', 'dinner', 'snack')
    ),
    CONSTRAINT budget_rules_severity_check CHECK (
        severity IN ('info', 'warning', 'critical')
    ),
    CONSTRAINT budget_rules_percentage_check CHECK (
        budget_percentage IS NULL OR 
        (budget_percentage >= 0 AND budget_percentage <= 100)
    )
);

-- Index for active rules
CREATE INDEX IF NOT EXISTS idx_budget_rules_active ON public.budget_rules(is_active) 
    WHERE is_active = true;

-- Comment
COMMENT ON TABLE public.budget_rules IS 'Optional table for customizable budget rules. Can be used to override hardcoded rules.';

-- ============ ROW LEVEL SECURITY ============

-- Enable RLS on food_prices (public read, admin write)
ALTER TABLE public.food_prices ENABLE ROW LEVEL SECURITY;

-- Everyone can read food prices
CREATE POLICY "food_prices_select_policy" ON public.food_prices
    FOR SELECT USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "food_prices_insert_policy" ON public.food_prices
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "food_prices_update_policy" ON public.food_prices
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "food_prices_delete_policy" ON public.food_prices
    FOR DELETE USING (auth.role() = 'service_role');

-- Enable RLS on budget_rules (public read, admin write)
ALTER TABLE public.budget_rules ENABLE ROW LEVEL SECURITY;

-- Everyone can read budget rules
CREATE POLICY "budget_rules_select_policy" ON public.budget_rules
    FOR SELECT USING (true);

-- Only service role can modify
CREATE POLICY "budget_rules_insert_policy" ON public.budget_rules
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "budget_rules_update_policy" ON public.budget_rules
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "budget_rules_delete_policy" ON public.budget_rules
    FOR DELETE USING (auth.role() = 'service_role');

-- ============ SEED DEFAULT FOOD PRICES ============
-- These are estimated prices for common Indonesian foods (per 100g in IDR)
-- Source: Market research average 2025-2026

INSERT INTO public.food_prices (food_id, price_per_100g, price_per_serving, serving_size_g, price_source, region)
SELECT 
    fi.id as food_id,
    CASE 
        -- Protein hewani (mahal)
        WHEN LOWER(fi.food_group) LIKE '%daging%' OR LOWER(fi.name) LIKE '%daging%' THEN 12000
        WHEN LOWER(fi.food_group) LIKE '%ikan%' OR LOWER(fi.name) LIKE '%ikan%' THEN 8000
        WHEN LOWER(fi.food_group) LIKE '%seafood%' OR LOWER(fi.name) LIKE '%udang%' THEN 15000
        WHEN LOWER(fi.food_group) LIKE '%ayam%' OR LOWER(fi.name) LIKE '%ayam%' THEN 6000
        
        -- Telur
        WHEN LOWER(fi.name) LIKE '%telur%' THEN 3000
        
        -- Protein nabati (murah)
        WHEN LOWER(fi.name) LIKE '%tempe%' THEN 1500
        WHEN LOWER(fi.name) LIKE '%tahu%' THEN 1200
        WHEN LOWER(fi.name) LIKE '%kacang%' THEN 2500
        
        -- Karbohidrat
        WHEN LOWER(fi.name) LIKE '%nasi%' OR LOWER(fi.name) LIKE '%beras%' THEN 800
        WHEN LOWER(fi.name) LIKE '%mie%' OR LOWER(fi.name) LIKE '%mi %' THEN 2000
        WHEN LOWER(fi.name) LIKE '%roti%' THEN 3000
        WHEN LOWER(fi.name) LIKE '%singkong%' OR LOWER(fi.name) LIKE '%ubi%' THEN 1000
        
        -- Sayuran
        WHEN LOWER(fi.food_group) LIKE '%sayur%' OR LOWER(fi.food_group) LIKE '%vegetable%' THEN 1500
        WHEN LOWER(fi.name) LIKE '%bayam%' OR LOWER(fi.name) LIKE '%kangkung%' THEN 1200
        WHEN LOWER(fi.name) LIKE '%wortel%' OR LOWER(fi.name) LIKE '%kentang%' THEN 1800
        
        -- Buah
        WHEN LOWER(fi.food_group) LIKE '%buah%' OR LOWER(fi.food_group) LIKE '%fruit%' THEN 2500
        WHEN LOWER(fi.name) LIKE '%pisang%' THEN 1500
        WHEN LOWER(fi.name) LIKE '%apel%' OR LOWER(fi.name) LIKE '%jeruk%' THEN 3000
        
        -- Susu dan dairy
        WHEN LOWER(fi.food_group) LIKE '%susu%' OR LOWER(fi.name) LIKE '%susu%' THEN 3500
        WHEN LOWER(fi.name) LIKE '%keju%' THEN 8000
        WHEN LOWER(fi.name) LIKE '%yogurt%' THEN 5000
        
        -- Minuman
        WHEN LOWER(fi.food_group) LIKE '%minuman%' OR LOWER(fi.food_group) LIKE '%beverage%' THEN 500
        
        -- Default fallback berdasarkan kalori
        ELSE GREATEST(1000, COALESCE(fi.energy::numeric, 100) * 8)
    END as price_per_100g,
    CASE 
        WHEN LOWER(fi.food_group) LIKE '%daging%' THEN 18000
        WHEN LOWER(fi.food_group) LIKE '%ikan%' THEN 12000
        WHEN LOWER(fi.name) LIKE '%ayam%' THEN 10000
        WHEN LOWER(fi.name) LIKE '%telur%' THEN 3000
        WHEN LOWER(fi.name) LIKE '%tempe%' THEN 3000
        WHEN LOWER(fi.name) LIKE '%tahu%' THEN 2500
        WHEN LOWER(fi.name) LIKE '%nasi%' THEN 2000
        WHEN LOWER(fi.food_group) LIKE '%sayur%' THEN 3000
        WHEN LOWER(fi.food_group) LIKE '%buah%' THEN 5000
        ELSE NULL
    END as price_per_serving,
    CASE 
        WHEN LOWER(fi.name) LIKE '%telur%' THEN 60  -- 1 butir
        WHEN LOWER(fi.name) LIKE '%nasi%' THEN 150  -- 1 porsi
        WHEN LOWER(fi.name) LIKE '%tempe%' THEN 100 -- 2 potong
        ELSE 100
    END as serving_size_g,
    'estimated' as price_source,
    'Indonesia' as region
FROM public.food_items fi
ON CONFLICT (food_id) DO NOTHING;

-- ============ SEED DEFAULT BUDGET RULES ============
-- Optional: Default budget rules for different budget tiers

INSERT INTO public.budget_rules (rule_name, description, min_daily_budget, max_daily_budget, meal_period, budget_percentage, severity, is_active)
VALUES 
    -- Very Low Budget Rules (≤ Rp25.000)
    ('very_low_breakfast', 'Alokasi sarapan untuk budget sangat terbatas', 0, 25000, 'breakfast', 25, 'info', true),
    ('very_low_lunch', 'Alokasi makan siang untuk budget sangat terbatas', 0, 25000, 'lunch', 35, 'info', true),
    ('very_low_dinner', 'Alokasi makan malam untuk budget sangat terbatas', 0, 25000, 'dinner', 30, 'info', true),
    ('very_low_snack', 'Alokasi snack untuk budget sangat terbatas', 0, 25000, 'snack', 10, 'info', true),
    
    -- Low Budget Rules (Rp25.001 - Rp40.000)
    ('low_breakfast', 'Alokasi sarapan untuk budget terbatas', 25001, 40000, 'breakfast', 25, 'info', true),
    ('low_lunch', 'Alokasi makan siang untuk budget terbatas', 25001, 40000, 'lunch', 35, 'info', true),
    ('low_dinner', 'Alokasi makan malam untuk budget terbatas', 25001, 40000, 'dinner', 30, 'info', true),
    ('low_snack', 'Alokasi snack untuk budget terbatas', 25001, 40000, 'snack', 10, 'info', true),
    
    -- Medium Budget Rules (Rp40.001 - Rp60.000)
    ('medium_breakfast', 'Alokasi sarapan untuk budget standar', 40001, 60000, 'breakfast', 25, 'info', true),
    ('medium_lunch', 'Alokasi makan siang untuk budget standar', 40001, 60000, 'lunch', 35, 'info', true),
    ('medium_dinner', 'Alokasi makan malam untuk budget standar', 40001, 60000, 'dinner', 30, 'info', true),
    ('medium_snack', 'Alokasi snack untuk budget standar', 40001, 60000, 'snack', 10, 'info', true),
    
    -- Warning rules
    ('budget_warning_50', 'Peringatan saat pengeluaran mencapai 50% dari budget harian', NULL, NULL, NULL, 50, 'warning', true),
    ('budget_warning_80', 'Peringatan saat pengeluaran mencapai 80% dari budget harian', NULL, NULL, NULL, 80, 'warning', true),
    ('budget_critical_100', 'Peringatan kritis saat melebihi budget', NULL, NULL, NULL, 100, 'critical', true)
ON CONFLICT DO NOTHING;

-- ============ VERIFY MIGRATION ============
DO $$
DECLARE
    food_prices_count integer;
    budget_rules_count integer;
BEGIN
    SELECT COUNT(*) INTO food_prices_count FROM public.food_prices;
    SELECT COUNT(*) INTO budget_rules_count FROM public.budget_rules;
    
    RAISE NOTICE 'Migration 008_budget_rules completed successfully!';
    RAISE NOTICE 'Food prices seeded: % rows', food_prices_count;
    RAISE NOTICE 'Budget rules seeded: % rows', budget_rules_count;
END $$;
