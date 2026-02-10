/**
 * Budget Rules Types
 * Types for budget-based meal recommendations and analysis
 */

import { BudgetRuleSeverity, MealPeriod } from '../dto';

// Re-export from dto for convenience
export type { BudgetRuleSeverity, MealPeriod };

export interface BudgetRule {
    id: string;
    rule_name: string;
    description: string;
    min_daily_budget?: number;
    max_daily_budget?: number;
    meal_period?: MealPeriod;
    budget_percentage?: number;
    severity: BudgetRuleSeverity;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

// ============ BUDGET ALLOCATION ============

export interface BudgetAllocation {
    breakfast: number;
    lunch: number;
    dinner: number;
    snack: number;
}

export const DEFAULT_BUDGET_ALLOCATION: BudgetAllocation = {
    breakfast: 25,
    lunch: 35,
    dinner: 30,
    snack: 10,
};

// ============ FOOD PRICE TYPES ============

export interface FoodPrice {
    id: string;
    food_id: number;
    price_per_100g: number;
    price_per_serving?: number;
    serving_size_g?: number;
    price_source?: string;
    region?: string;
    created_at?: string;
    updated_at: string;
}

export interface FoodItemWithPrice {
    food_id: number;
    name: string;
    food_group?: string;
    price_per_100g?: number;
    price_per_serving?: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

// ============ BUDGET ANALYSIS TYPES ============

export interface MealBudgetAnalysis {
    meal_type: MealPeriod;
    allocated_budget: number;
    estimated_cost: number;
    remaining_budget: number;
    is_within_budget: boolean;
    budget_utilization_percentage: number;
}

export interface DailyBudgetAnalysis {
    daily_budget: number;
    total_spent: number;
    remaining_budget: number;
    is_within_budget: boolean;
    budget_utilization_percentage: number;
    meals: MealBudgetAnalysis[];
    budget_warnings: string[];
    budget_tips: string[];
}

export interface WeeklyBudgetAnalysis {
    weekly_budget: number;
    total_spent: number;
    average_daily_spent: number;
    days_over_budget: number;
    days_under_budget: number;
    budget_trend: 'increasing' | 'decreasing' | 'stable';
    daily_breakdown: {
        date: string;
        spent: number;
        budget: number;
        is_over_budget: boolean;
    }[];
}

// ============ BUDGET RECOMMENDATION TYPES ============

export interface BudgetRecommendation {
    food_id: number;
    name: string;
    estimated_price: number;
    price_per_calorie: number;
    nutrition_value_score: number;
    reason: string;
    meal_suggestion?: MealPeriod;
}

export interface BudgetAwareFoodSuggestion {
    meal_type: MealPeriod;
    budget_available: number;
    recommendations: BudgetRecommendation[];
    total_estimated_cost: number;
    nutrients_covered: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

// ============ BUDGET TIER TYPES ============

export type BudgetTier = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface BudgetTierDefinition {
    tier: BudgetTier;
    min_budget: number;
    max_budget: number;
    description: string;
    meal_suggestions: string[];
    cost_saving_tips: string[];
}

export const BUDGET_TIERS: BudgetTierDefinition[] = [
    {
        tier: 'very_low',
        min_budget: 0,
        max_budget: 25000,
        description: 'Budget sangat terbatas',
        meal_suggestions: [
            'Nasi dengan tempe/tahu',
            'Telur rebus/orak-arik',
            'Sayur bayam/kangkung',
            'Bubur ayam',
        ],
        cost_saving_tips: [
            'Beli bahan mentah dan masak sendiri',
            'Pilih protein nabati seperti tempe dan tahu',
            'Beli sayuran lokal musiman',
            'Hindari makanan kemasan',
        ],
    },
    {
        tier: 'low',
        min_budget: 25001,
        max_budget: 40000,
        description: 'Budget terbatas',
        meal_suggestions: [
            'Nasi campur warteg',
            'Ayam goreng/bakar porsi kecil',
            'Mie ayam/bakso',
            'Gado-gado',
        ],
        cost_saving_tips: [
            'Masak untuk beberapa hari sekaligus',
            'Kombinasikan protein hewani dan nabati',
            'Bawa bekal dari rumah',
        ],
    },
    {
        tier: 'medium',
        min_budget: 40001,
        max_budget: 60000,
        description: 'Budget standar',
        meal_suggestions: [
            'Nasi Padang porsi sedang',
            'Ayam geprek',
            'Soto ayam',
            'Pecel lele',
        ],
        cost_saving_tips: [
            'Pilih paket hemat jika makan di luar',
            'Kombinasikan makan di rumah dan di luar',
        ],
    },
    {
        tier: 'high',
        min_budget: 60001,
        max_budget: 100000,
        description: 'Budget cukup',
        meal_suggestions: [
            'Nasi Padang lengkap',
            'Sate ayam/kambing',
            'Ikan bakar',
            'Steak lokal',
        ],
        cost_saving_tips: [
            'Investasi di makanan berkualitas',
            'Variasikan jenis protein',
        ],
    },
    {
        tier: 'very_high',
        min_budget: 100001,
        max_budget: Infinity,
        description: 'Budget tinggi',
        meal_suggestions: [
            'Makanan restoran',
            'Seafood premium',
            'Daging berkualitas',
            'Makanan organik',
        ],
        cost_saving_tips: [
            'Fokus pada kualitas dan variasi nutrisi',
            'Pertimbangkan makanan organik',
        ],
    },
];

// ============ HELPER FUNCTIONS ============

export function getBudgetTier(dailyBudget: number): BudgetTierDefinition {
    const tier = BUDGET_TIERS.find(
        (t) => dailyBudget >= t.min_budget && dailyBudget <= t.max_budget,
    );
    return tier || BUDGET_TIERS[2];
}

export function calculateMealBudget(
    dailyBudget: number,
    mealType: MealPeriod,
    allocation: BudgetAllocation = DEFAULT_BUDGET_ALLOCATION,
): number {
    const mealTypeKey = mealType as keyof BudgetAllocation;
    const percentage = allocation[mealTypeKey] || 25;
    return Math.round((dailyBudget * percentage) / 100);
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
