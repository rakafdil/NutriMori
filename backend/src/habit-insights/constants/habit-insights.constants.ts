import { PeriodType } from '../dto';
import { UserTargets } from '../types';

// ============ DAY MAPPINGS ============

export const DAY_NAMES = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
    'Thursday', 'Friday', 'Saturday'
] as const;

export const WEEKEND_DAYS = ['Saturday', 'Sunday'] as const;

export const DAY_ABBREVIATIONS: Record<string, string> = {
    Sunday: 'Su',
    Monday: 'Mo',
    Tuesday: 'Tu',
    Wednesday: 'We',
    Thursday: 'Th',
    Friday: 'Fr',
    Saturday: 'Sa',
};

// ============ MEAL TIME SLOTS ============

export interface MealTimeSlot {
    name: string;
    start: number;
    end: number;
}

export const MEAL_TIME_SLOTS: MealTimeSlot[] = [
    { name: 'Breakfast', start: 5, end: 10 },
    { name: 'Lunch', start: 11, end: 14 },
    { name: 'Snack', start: 14, end: 17 },
    { name: 'Dinner', start: 17, end: 21 },
    { name: 'Late Night', start: 21, end: 24 },
];

export const LATE_NIGHT_HOURS = { start: 21, end: 4 };

// ============ FOOD GROUP KEYWORDS ============

export const FOOD_GROUP_KEYWORDS = {
    vegetables: ['sayur', 'vegetable', 'greens', 'salad'],
    fruits: ['buah', 'fruit'],
    protein: ['daging', 'meat', 'ayam', 'chicken', 'ikan', 'fish', 'telur', 'egg'],
    grains: ['nasi', 'rice', 'roti', 'bread', 'mie', 'noodle'],
};

// ============ DEFAULT USER TARGETS ============

export const DEFAULT_USER_TARGETS: UserTargets = {
    calories: 2150,
    protein: 60,
    carbs: 300,
    fat: 65,
    sugar: 50, // WHO recommendation
    fiber: 30,
    sodium: 1500,
};

// ============ PATTERN THRESHOLDS ============

export const PATTERN_THRESHOLDS = {
    // Minimum days to trigger a pattern
    minDaysForPattern: 3,
    minDaysForConsistency: 5,
    
    // Percentage thresholds
    breakfastSkipThreshold: 3,
    weekendSugarMultiplier: 1.3,
    sugarTargetRatio: 0.6,
    
    lowNutrientRatio: 0.5,
    goodNutrientRatio: 0.8,
    excessNutrientRatio: 1.2,
    
    // Calorie consistency (std dev ratio)
    calorieConsistencyRatio: 0.2,
    
    // Coverage ratios
    vegetableCoverageRatio: 0.7,
    fiberCoverageRatio: 0.6,
    lowProteinCoverageRatio: 0.5,
};

// ============ TREND THRESHOLDS ============

export const TREND_THRESHOLDS = {
    increasingRatio: 1.1,
    decreasingRatio: 0.9,
    belowTargetRatio: 0.8,
    aboveTargetRatio: 1.2,
};

// ============ HEALTH SCORE WEIGHTS ============

export const HEALTH_SCORE_CONFIG = {
    baseScore: 70,
    weights: {
        consistency: 0.25,
        balance: 0.35,
        patterns: 0.25,
        completion: 0.15,
        // Legacy pattern weights
        positivePatternHigh: 5,
        positivePatternMedium: 3,
        negativePatternHigh: -8,
        negativePatternMedium: -4,
        onTargetNutrient: 3,
        belowTargetCritical: -3,
        aboveTargetWarning: -5,
    },
    idealRange: {
        min: 0.85,
        max: 1.15,
    },
    criticalNutrients: ['Protein', 'Serat'],
    warningNutrients: ['Gula'],
};

// ============ CACHE EXPIRY (in days) ============

export const CACHE_EXPIRY_DAYS: Record<PeriodType, number> = {
    [PeriodType.WEEKLY]: 1,
    [PeriodType.MONTHLY]: 3,
    [PeriodType.YEARLY]: 7,
    [PeriodType.OVERALL]: 7,
};

// ============ GEMINI CONFIG ============

export const GEMINI_CONFIG = {
    // Updated to gemini-2.0-flash-lite (more quota-friendly)
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent',
    temperature: 0.7,
    maxOutputTokens: 400,
};

// ============ NUTRIENT DISPLAY CONFIG ============

export const NUTRIENT_CONFIG = [
    { key: 'protein', name: 'Protein', targetKey: 'protein' },
    { key: 'carbs', name: 'Karbohidrat', targetKey: 'carbs' },
    { key: 'fat', name: 'Lemak', targetKey: 'fat' },
    { key: 'fiber', name: 'Serat', targetKey: 'fiber' },
    { key: 'sugar', name: 'Gula', targetKey: 'sugar' },
] as const;
