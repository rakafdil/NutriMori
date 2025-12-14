-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================
-- Jalankan script ini di Supabase SQL Editor

-- ============================================
-- 1. NUTRITION_ANALYSIS TABLE
-- ============================================
ALTER TABLE public.nutrition_analysis ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT their own nutrition analysis
CREATE POLICY "Users can view own nutrition analysis"
ON public.nutrition_analysis
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can INSERT their own nutrition analysis
CREATE POLICY "Users can insert own nutrition analysis"
ON public.nutrition_analysis
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can UPDATE their own nutrition analysis
CREATE POLICY "Users can update own nutrition analysis"
ON public.nutrition_analysis
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can DELETE their own nutrition analysis
CREATE POLICY "Users can delete own nutrition analysis"
ON public.nutrition_analysis
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 2. FOOD_LOGS TABLE
-- ============================================
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own food logs"
ON public.food_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food logs"
ON public.food_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food logs"
ON public.food_logs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food logs"
ON public.food_logs
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 3. FOOD_LOG_ITEMS TABLE
-- ============================================
ALTER TABLE public.food_log_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access food log items via their food logs
CREATE POLICY "Users can view own food log items"
ON public.food_log_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.food_logs 
    WHERE food_logs.log_id = food_log_items.log_id 
    AND food_logs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own food log items"
ON public.food_log_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.food_logs 
    WHERE food_logs.log_id = food_log_items.log_id 
    AND food_logs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own food log items"
ON public.food_log_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.food_logs 
    WHERE food_logs.log_id = food_log_items.log_id 
    AND food_logs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own food log items"
ON public.food_log_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.food_logs 
    WHERE food_logs.log_id = food_log_items.log_id 
    AND food_logs.user_id = auth.uid()
  )
);

-- ============================================
-- 4. USER_PREFERENCES TABLE
-- ============================================
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================
-- 5. USERS TABLE
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- 6. READ-ONLY TABLES (Public Access)
-- ============================================
-- Tables like food_items, nutrition_rules, dataset_akg 
-- should be readable by everyone

ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read food items"
ON public.food_items
FOR SELECT
USING (true);

ALTER TABLE public.nutrition_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read nutrition rules"
ON public.nutrition_rules
FOR SELECT
USING (true);

ALTER TABLE public.dataset_akg ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read AKG data"
ON public.dataset_akg
FOR SELECT
USING (true);

ALTER TABLE public.food_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read food embeddings"
ON public.food_embeddings
FOR SELECT
USING (true);

-- ============================================
-- BYPASS RLS untuk Service Role (Backend)
-- ============================================
-- Catatan: Service Role Key secara default BYPASS RLS.
-- Jika Anda ingin backend menggunakan RLS, gunakan getUserClient()
-- dengan access token user alih-alih getClient().

-- ============================================
-- TROUBLESHOOTING
-- ============================================
-- Jika masih error setelah menambah policy:
-- 1. Pastikan auth.uid() mengembalikan nilai yang benar
-- 2. Cek apakah user_id di tabel cocok dengan auth.uid()
-- 3. Test query langsung di Supabase SQL Editor:
--    SELECT auth.uid(); -- Harus return UUID user yang login
--
-- Untuk debug, tambahkan policy sementara:
-- CREATE POLICY "Debug - allow all" ON public.nutrition_analysis FOR ALL USING (true);
