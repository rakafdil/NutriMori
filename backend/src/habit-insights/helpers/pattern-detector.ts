import {
    FOOD_GROUP_KEYWORDS,
    LATE_NIGHT_HOURS,
    MEAL_TIME_SLOTS,
    PATTERN_THRESHOLDS,
    WEEKEND_DAYS,
} from '../constants';
import { HabitPatternDto } from '../dto';
import { AggregatedDayData, PatternRule, PatternRuleResult, UserTargets } from '../types';

/**
 * Pattern Detector
 * 
 * Detects eating patterns from aggregated food log data.
 * Uses configurable rules for easy extension.
 */

// ============ HELPER FUNCTIONS ============

const getDayOfWeek = (day: AggregatedDayData): string => {
    return day.dayOfWeek || day.dayName || 'Unknown';
};

const getMeals = (day: AggregatedDayData): number => {
    return day.meals ?? day.mealCount ?? 0;
};

const getSugar = (day: AggregatedDayData): number => {
    return day.sugar ?? day.totalSugar ?? 0;
};

const getProtein = (day: AggregatedDayData): number => {
    return day.protein ?? day.totalProtein ?? 0;
};

const getFiber = (day: AggregatedDayData): number => {
    return day.fiber ?? day.totalFiber ?? 0;
};

const getSodium = (day: AggregatedDayData): number => {
    return day.sodium ?? day.totalSodium ?? 0;
};

const getCalories = (day: AggregatedDayData): number => {
    return day.calories ?? day.totalCalories ?? 0;
};

const getMealTimes = (day: AggregatedDayData): number[] => {
    return day.mealTimes ?? [];
};

const hasBreakfast = (day: AggregatedDayData): boolean => {
    const breakfastSlot = MEAL_TIME_SLOTS.find(s => s.name === 'Breakfast');
    if (!breakfastSlot) return false;
    
    return (
        day.mealTypes.some(m => m?.toLowerCase() === 'breakfast') ||
        getMealTimes(day).some(h => h >= breakfastSlot.start && h < breakfastSlot.end)
    );
};

const isWeekend = (dayOfWeek: string): boolean => {
    return WEEKEND_DAYS.includes(dayOfWeek as any);
};

const isLateNight = (hour: number): boolean => {
    return hour >= LATE_NIGHT_HOURS.start || hour <= LATE_NIGHT_HOURS.end;
};

const hasVegetables = (day: AggregatedDayData): boolean => {
    return (day.foodGroups ?? []).some(g =>
        FOOD_GROUP_KEYWORDS.vegetables.some(keyword => g.includes(keyword))
    );
};

const calculateAverage = (values: number[]): number => {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
};

const calculateStdDev = (values: number[], avg: number): number => {
    if (values.length === 0) return 0;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
};

// ============ PATTERN RULES ============

const patternRules: PatternRule[] = [
    // 1. Breakfast Skipping
    {
        id: 'breakfast-skip',
        name: 'Breakfast Skipping',
        type: 'negative',
        impact: 'High',
        check: (data): PatternRuleResult | null => {
            const skipDays = data.filter(d => !hasBreakfast(d) && getMeals(d) > 0);
            
            if (skipDays.length >= PATTERN_THRESHOLDS.breakfastSkipThreshold) {
                return {
                    message: `Melewatkan sarapan ${skipDays.length} hari`,
                    daysDetected: skipDays.map(d => getDayOfWeek(d)),
                };
            }
            return null;
        },
    },

    // 2. Weekend High Sugar
    {
        id: 'weekend-sugar',
        name: 'Weekend High Sugar',
        type: 'negative',
        impact: 'Medium',
        check: (data, targets): PatternRuleResult | null => {
            const weekendDays = data.filter(d => isWeekend(getDayOfWeek(d)));
            const weekdayDays = data.filter(d => !isWeekend(getDayOfWeek(d)));

            const avgWeekendSugar = calculateAverage(weekendDays.map(d => getSugar(d)));
            const avgWeekdaySugar = calculateAverage(weekdayDays.map(d => getSugar(d)));

            const exceedsTarget = avgWeekendSugar > targets.sugar * PATTERN_THRESHOLDS.sugarTargetRatio;
            const higherThanWeekday = avgWeekendSugar > avgWeekdaySugar * PATTERN_THRESHOLDS.weekendSugarMultiplier;

            if (exceedsTarget && higherThanWeekday) {
                return {
                    message: 'Asupan gula berlebih di akhir pekan',
                    daysDetected: ['Saturday', 'Sunday'],
                };
            }
            return null;
        },
    },

    // 3. Consistent Vegetable Consumption
    {
        id: 'vegetable-consistency',
        name: 'Vegetable Consistency',
        type: 'positive',
        impact: 'Medium',
        check: (data): PatternRuleResult | null => {
            const vegDays = data.filter(hasVegetables);
            const threshold = Math.min(5, data.length * PATTERN_THRESHOLDS.vegetableCoverageRatio);

            if (vegDays.length >= threshold) {
                return {
                    message: 'Konsisten makan sayur saat makan siang',
                    streak: vegDays.length,
                };
            }
            return null;
        },
    },

    // 4. Low Protein Intake
    {
        id: 'low-protein',
        name: 'Low Protein Intake',
        type: 'negative',
        impact: 'High',
        check: (data, targets): PatternRuleResult | null => {
            const lowDays = data.filter(d => getProtein(d) < targets.protein * PATTERN_THRESHOLDS.lowNutrientRatio);
            
            if (lowDays.length >= data.length * PATTERN_THRESHOLDS.lowProteinCoverageRatio) {
                return {
                    message: 'Asupan protein kurang dari target',
                    frequency: `${lowDays.length} dari ${data.length} hari`,
                };
            }
            return null;
        },
    },

    // 5. High Sodium
    {
        id: 'high-sodium',
        name: 'High Sodium',
        type: 'negative',
        impact: 'High',
        check: (data, targets): PatternRuleResult | null => {
            const highDays = data.filter(d => getSodium(d) > targets.sodium);

            if (highDays.length >= PATTERN_THRESHOLDS.minDaysForPattern) {
                return {
                    message: 'Konsumsi garam tinggi terdeteksi',
                    daysDetected: highDays.slice(0, 5).map(d => getDayOfWeek(d)),
                };
            }
            return null;
        },
    },

    // 6. Good Fiber Intake
    {
        id: 'good-fiber',
        name: 'Good Fiber Intake',
        type: 'positive',
        impact: 'Medium',
        check: (data, targets): PatternRuleResult | null => {
            const goodDays = data.filter(d => getFiber(d) >= targets.fiber * PATTERN_THRESHOLDS.goodNutrientRatio);

            if (goodDays.length >= data.length * PATTERN_THRESHOLDS.fiberCoverageRatio) {
                return {
                    message: 'Asupan serat memenuhi target',
                    streak: goodDays.length,
                };
            }
            return null;
        },
    },

    // 7. Calorie Consistency
    {
        id: 'calorie-consistency',
        name: 'Calorie Consistency',
        type: 'positive',
        impact: 'High',
        check: (data): PatternRuleResult | null => {
            if (data.length < PATTERN_THRESHOLDS.minDaysForConsistency) return null;

            const calories = data.map(d => getCalories(d));
            const avg = calculateAverage(calories);
            const stdDev = calculateStdDev(calories, avg);

            if (stdDev < avg * PATTERN_THRESHOLDS.calorieConsistencyRatio) {
                return {
                    message: 'Pola makan konsisten dengan kalori stabil',
                    frequency: 'Daily',
                };
            }
            return null;
        },
    },

    // 8. Late Night Eating
    {
        id: 'late-night',
        name: 'Late Night Eating',
        type: 'negative',
        impact: 'Medium',
        check: (data): PatternRuleResult | null => {
            const lateNightDays = data.filter(d => getMealTimes(d).some(isLateNight));

            if (lateNightDays.length >= PATTERN_THRESHOLDS.minDaysForPattern) {
                return {
                    message: 'Sering makan larut malam',
                    daysDetected: lateNightDays.map(d => getDayOfWeek(d)),
                };
            }
            return null;
        },
    },
];

// ============ PATTERN DETECTOR CLASS ============

export class PatternDetector {
    private rules: PatternRule[];

    constructor(customRules?: PatternRule[]) {
        this.rules = customRules || patternRules;
    }

    /**
     * Static method to detect patterns with default rules
     */
    static detectPatterns(data: AggregatedDayData[], targets: UserTargets): HabitPatternDto[] {
        const detector = new PatternDetector();
        return detector.detect(data, targets);
    }

    /**
     * Detect all patterns from aggregated data
     */
    detect(data: AggregatedDayData[], targets: UserTargets): HabitPatternDto[] {
        if (data.length === 0) return [];

        const patterns: HabitPatternDto[] = [];

        for (const rule of this.rules) {
            // Normalize data for rule compatibility
            const normalizedData = this.normalizeData(data);
            const result = rule.check(normalizedData, targets);
            
            if (result) {
                patterns.push({
                    type: rule.type,
                    message: result.message,
                    impact: rule.impact,
                    daysDetected: result.daysDetected,
                    streak: result.streak,
                    frequency: result.frequency,
                });
            }
        }

        return patterns;
    }

    /**
     * Normalize data to ensure compatibility with rules
     */
    private normalizeData(data: AggregatedDayData[]): AggregatedDayData[] {
        return data.map(d => ({
            ...d,
            dayOfWeek: d.dayOfWeek || d.dayName,
            meals: d.meals ?? d.mealCount ?? 0,
            calories: d.calories ?? d.totalCalories ?? 0,
            protein: d.protein ?? d.totalProtein ?? 0,
            carbs: d.carbs ?? d.totalCarbs ?? 0,
            fat: d.fat ?? d.totalFat ?? 0,
            sugar: d.sugar ?? d.totalSugar ?? 0,
            fiber: d.fiber ?? d.totalFiber ?? 0,
            sodium: d.sodium ?? d.totalSodium ?? 0,
            mealTimes: d.mealTimes ?? [],
            foodGroups: d.foodGroups ?? [],
        }));
    }

    /**
     * Add a custom pattern rule
     */
    addRule(rule: PatternRule): void {
        this.rules.push(rule);
    }

    /**
     * Get all registered rules
     */
    getRules(): PatternRule[] {
        return [...this.rules];
    }
}

// Export default instance
export const patternDetector = new PatternDetector();
