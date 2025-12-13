import { MealTimingPatternDto, NutrientTrendDto } from '../dto';

// ============ NUTRITION ANALYSIS TYPES (Primary Data Source) ============

/**
 * Joined food_logs data from Supabase
 * Note: food_logs table uses created_at, not log_date
 */
export interface JoinedFoodLog {
    log_id: string;
    user_id: string;
    meal_type: string;
    created_at: string;  // Used for date filtering
}

/**
 * Record from nutrition_analysis table joined with food_logs
 * This is the primary data source for habit insights
 * Note: Supabase returns food_logs as array when using !inner join
 */
export interface NutritionAnalysisRecord {
    id: string;
    food_log_id: string;
    user_id: string;
    // Macronutrients
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    total_sugar: number;
    total_fiber: number;
    total_sodium: number;
    total_cholesterol: number;
    // Micronutrients (JSONB)
    micronutrients: Record<string, number | string>;
    // Health insights
    health_tags: string[];
    warnings: string[];
    // Timestamps
    created_at: string;
    updated_at: string;
    // Joined from food_logs (Supabase returns as array with !inner)
    food_logs?: JoinedFoodLog | JoinedFoodLog[];
}

// ============ FOOD LOG TYPES (Legacy - for compatibility) ============

export interface FoodLogWithItems {
    log_id: string;
    user_id: string;
    meal_type: string;
    log_date: string;
    log_time: string;
    created_at: string;
    food_log_items?: FoodLogItem[];
    items?: FoodLogItem[];
}

export interface FoodLogItem {
    item_id: string;
    food_id: number;
    qty: number;
    gram_weight: number;
    food_items?: FoodItemNutrition;
    food?: FoodItemNutrition;
}

export interface FoodItemNutrition {
    id: number;
    name: string;
    food_group?: string;
    energy?: number;
    calories?: number;
    protein: number;
    carbohydrate?: number;
    carbohydrates?: number;
    total_fat?: number;
    fat?: number;
    sugar: number;
    fiber: number;
    sodium: number;
    cholesterol?: number;
}

// ============ AGGREGATION TYPES ============

export interface AggregatedDayData {
    date: string;
    dayName: string;
    dayOfWeek?: string;
    meals?: number;
    mealCount: number;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalSugar: number;
    totalFiber: number;
    totalSodium: number;
    totalCholesterol?: number;
    // Health insights from nutrition_analysis
    healthTags: string[];
    warnings: string[];
    micronutrients: Record<string, number | string>;
    // Legacy compatibility
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sugar?: number;
    fiber?: number;
    sodium?: number;
    mealTypes: string[];
    mealTimes?: number[];
    foodGroups?: string[];
}

// ============ USER TYPES ============

export interface UserTargets {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    fiber: number;
    sodium: number;
}

export interface UserProfile {
    age: number;
    weight_kg?: number;
    height_cm?: number;
    gender?: string;
}

// ============ CACHE TYPES ============

export interface CachedInsight {
    id: string;
    user_id: string;
    period: string;
    data_hash: string;
    expires_at: string;
    patterns: PatternDto[];
    nutrient_trends: NutrientTrendDto[];
    meal_timings?: MealTimingPatternDto[];
    recommendations: string[];
    summary: string;
    health_score: number;
    days_analyzed?: number;
    total_meals?: number;
    average_calories?: number;
}

// ============ PATTERN DTO ============

export interface PatternDto {
    pattern: string;
    impact: 'positive' | 'negative' | 'neutral';
    severity: 'High' | 'Medium' | 'Low';
    message: string;
    frequency?: string;
    daysAffected?: string[];
}

// ============ AI RESPONSE TYPES ============

export interface AiInsightResult {
    summary: string;
    recommendations: string[];
    healthScore?: number;
}

// ============ PATTERN RULE TYPES ============

export type PatternType = 'positive' | 'negative' | 'neutral';
export type ImpactLevel = 'High' | 'Medium' | 'Low';

export interface PatternRule {
    id: string;
    name: string;
    type: PatternType;
    impact: ImpactLevel;
    check: (data: AggregatedDayData[], targets: UserTargets) => PatternRuleResult | null;
}

export interface PatternRuleResult {
    message: string;
    daysDetected?: string[];
    streak?: number;
    frequency?: string;
}
