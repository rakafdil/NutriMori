-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.food_embeddings (
  id integer NOT NULL DEFAULT nextval('food_embeddings_id_seq'::regclass),
  food_id integer NOT NULL UNIQUE,
  nama text NOT NULL,
  embedding USER-DEFINED,
  nutrition_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT food_embeddings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.food_items (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  condition text,
  food_group text,
  energy numeric,
  protein numeric,
  total_fat numeric,
  carbohydrate numeric,
  sugar numeric,
  fiber numeric,
  calcium numeric,
  phosphorus numeric,
  iron numeric,
  magnesium numeric,
  potassium numeric,
  sodium numeric,
  zinc numeric,
  copper numeric,
  vitamin_c numeric,
  vitamin_b1 numeric,
  vitamin_b2 numeric,
  vitamin_b3 numeric,
  vitamin_b6 numeric,
  vitamin_b9 numeric,
  vitamin_b12 numeric,
  vitamin_a numeric,
  vitamin_d numeric,
  vitamin_e numeric,
  vitamin_k numeric,
  saturated_fat numeric,
  monounsaturated_fat numeric,
  polyunsaturated_fat numeric,
  cholesterol numeric,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT food_items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.food_log_items (
  item_id uuid NOT NULL DEFAULT gen_random_uuid(),
  log_id uuid NOT NULL,
  food_id integer,
  qty double precision,
  unit text,
  gram_weight double precision,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT food_log_items_pkey PRIMARY KEY (item_id),
  CONSTRAINT food_log_items_log_id_fkey FOREIGN KEY (log_id) REFERENCES public.food_logs(log_id),
  CONSTRAINT food_log_items_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.food_embeddings(food_id)
);
CREATE TABLE public.food_logs (
  log_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  raw_text text,
  meal_type USER-DEFINED,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT food_logs_pkey PRIMARY KEY (log_id),
  CONSTRAINT food_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.nutrition_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  food_log_id uuid NOT NULL,
  user_id uuid NOT NULL,
  total_calories numeric NOT NULL DEFAULT 0,
  total_protein numeric NOT NULL DEFAULT 0,
  total_carbs numeric NOT NULL DEFAULT 0,
  total_fat numeric NOT NULL DEFAULT 0,
  total_sugar numeric NOT NULL DEFAULT 0,
  total_fiber numeric DEFAULT 0,
  total_sodium numeric DEFAULT 0,
  total_cholesterol numeric DEFAULT 0,
  micronutrients jsonb DEFAULT '{}'::jsonb,
  health_tags ARRAY DEFAULT ARRAY[]::text[],
  warnings ARRAY DEFAULT ARRAY[]::text[],
  CONSTRAINT nutrition_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT nutrition_analysis_food_log_id_fkey FOREIGN KEY (food_log_id) REFERENCES public.food_logs(log_id),
  CONSTRAINT nutrition_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.nutrition_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  description text,
  min_value numeric,
  max_value numeric,
  nutrient text,
  severity text,
  created_at timestamp without time zone DEFAULT now(),
  target_type text DEFAULT 'global'::text,
  target_value text,
  output_type text DEFAULT 'warning'::text,
  CONSTRAINT nutrition_rules_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  allergies ARRAY,
  goals ARRAY,
  tastes ARRAY,
  medical_history ARRAY,
  meal_times jsonb DEFAULT '[]'::jsonb,
  daily_budget integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  username text,
  age integer,
  height_cm integer,
  weight_kg integer,
  isFillingPreferences boolean DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);