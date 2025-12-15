import { DAY_NAMES, MEAL_TIME_SLOTS } from '../constants';
import { AggregatedDayData, FoodLogWithItems, NutritionAnalysisRecord } from '../types';

/**
 * Data Aggregator
 * 
 * Aggregates nutrition analysis data into daily summaries.
 * Now uses pre-computed data from nutrition_analysis table.
 */

export class DataAggregator {
    /**
     * Aggregate nutrition analysis records into daily summaries
     * PRIMARY METHOD - uses nutrition_analysis table
     */
    static aggregateFromNutritionAnalysis(records: NutritionAnalysisRecord[]): AggregatedDayData[] {
        const grouped = this.groupNutritionByDate(records);
        return this.transformNutritionToAggregated(grouped);
    }

    /**
     * Helper to get food_logs data (handles both array and object)
     * Uses created_at as the date field (food_logs doesn't have log_date)
     */
    private static getFoodLog(record: NutritionAnalysisRecord): { created_at?: string; meal_type?: string } {
        const logs = record.food_logs;
        if (!logs) return {};
        if (Array.isArray(logs)) return logs[0] || {};
        return logs;
    }

    /**
     * Group nutrition records by date
     */
    private static groupNutritionByDate(
        records: NutritionAnalysisRecord[]
    ): Map<string, NutritionAnalysisRecord[]> {
        const grouped = new Map<string, NutritionAnalysisRecord[]>();

        for (const record of records) {
            const foodLog = this.getFoodLog(record);
            // Use created_at from food_logs or nutrition_analysis
            const logDate = foodLog.created_at || record.created_at;
            const date = new Date(logDate).toISOString().split('T')[0];
            
            if (!grouped.has(date)) {
                grouped.set(date, []);
            }
            grouped.get(date)!.push(record);
        }

        return grouped;
    }

    /**
     * Transform grouped nutrition data into aggregated format
     */
    private static transformNutritionToAggregated(
        grouped: Map<string, NutritionAnalysisRecord[]>
    ): AggregatedDayData[] {
        return Array.from(grouped.entries()).map(([date, records]) => {
            const totals = this.calculateNutritionTotals(records);
            const healthInsights = this.aggregateHealthInsights(records);
            const mealTypes = records
                .map(r => this.getFoodLog(r).meal_type || 'unknown')
                .filter(m => m !== 'unknown');

            return {
                date,
                dayName: this.getDayName(date),
                ...totals,
                ...healthInsights,
                mealCount: records.length,
                mealTypes,
            };
        });
    }

    /**
     * Calculate nutritional totals from nutrition_analysis records
     */
    private static calculateNutritionTotals(records: NutritionAnalysisRecord[]): NutritionTotals {
        // Helper to round to 2 decimal places to avoid floating point precision issues
        const roundTo2 = (val: number) => Math.round(val * 100) / 100;

        const totals: NutritionTotals = {
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
            totalFiber: 0,
            totalSugar: 0,
            totalSodium: 0,
            totalCholesterol: 0,
        };

        for (const record of records) {
            totals.totalCalories += Number(record.total_calories) || 0;
            totals.totalProtein += Number(record.total_protein) || 0;
            totals.totalCarbs += Number(record.total_carbs) || 0;
            totals.totalFat += Number(record.total_fat) || 0;
            totals.totalFiber += Number(record.total_fiber) || 0;
            totals.totalSugar += Number(record.total_sugar) || 0;
            totals.totalSodium += Number(record.total_sodium) || 0;
            totals.totalCholesterol += Number(record.total_cholesterol) || 0;
        }

        // Round all totals to avoid floating point precision issues
        totals.totalCalories = roundTo2(totals.totalCalories);
        totals.totalProtein = roundTo2(totals.totalProtein);
        totals.totalCarbs = roundTo2(totals.totalCarbs);
        totals.totalFat = roundTo2(totals.totalFat);
        totals.totalFiber = roundTo2(totals.totalFiber);
        totals.totalSugar = roundTo2(totals.totalSugar);
        totals.totalSodium = roundTo2(totals.totalSodium);
        totals.totalCholesterol = roundTo2(totals.totalCholesterol);

        return totals;
    }

    /**
     * Aggregate health insights from nutrition_analysis records
     */
    private static aggregateHealthInsights(records: NutritionAnalysisRecord[]): HealthInsights {
        const allTags = new Set<string>();
        const allWarnings = new Set<string>();
        const mergedMicronutrients: Record<string, number> = {};

        for (const record of records) {
            // Collect unique health tags
            for (const tag of record.health_tags || []) {
                allTags.add(tag);
            }

            // Collect unique warnings
            for (const warning of record.warnings || []) {
                allWarnings.add(warning);
            }

            // Sum micronutrients
            const micro = record.micronutrients || {};
            for (const [key, value] of Object.entries(micro)) {
                const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
                mergedMicronutrients[key] = (mergedMicronutrients[key] || 0) + numValue;
            }
        }

        return {
            healthTags: Array.from(allTags),
            warnings: Array.from(allWarnings),
            micronutrients: mergedMicronutrients,
        };
    }

    /**
     * Get day name from date string
     */
    private static getDayName(dateStr: string): string {
        const dayIndex = new Date(dateStr).getDay();
        return DAY_NAMES[dayIndex];
    }

    // ============ LEGACY METHODS (for backward compatibility) ============

    /**
     * @deprecated Use aggregateFromNutritionAnalysis instead
     * Aggregate food logs into daily summaries
     */
    static aggregateByDay(logs: FoodLogWithItems[]): AggregatedDayData[] {
        const grouped = this.groupByDate(logs);
        return this.transformToAggregated(grouped);
    }

    private static groupByDate(logs: FoodLogWithItems[]): Map<string, FoodLogWithItems[]> {
        const grouped = new Map<string, FoodLogWithItems[]>();

        for (const log of logs) {
            const date = new Date(log.log_date).toISOString().split('T')[0];
            if (!grouped.has(date)) {
                grouped.set(date, []);
            }
            grouped.get(date)!.push(log);
        }

        return grouped;
    }

    private static transformToAggregated(grouped: Map<string, FoodLogWithItems[]>): AggregatedDayData[] {
        return Array.from(grouped.entries()).map(([date, logs]) => ({
            date,
            dayName: this.getDayName(date),
            ...this.calculateTotals(logs),
            mealCount: logs.length,
            mealTypes: this.getMealTypes(logs),
            healthTags: [],
            warnings: [],
            micronutrients: {},
        }));
    }

    private static calculateTotals(logs: FoodLogWithItems[]): NutritionTotals {
        // Helper to round to 2 decimal places to avoid floating point precision issues
        const roundTo2 = (val: number) => Math.round(val * 100) / 100;

        const totals: NutritionTotals = {
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
            totalFiber: 0,
            totalSugar: 0,
            totalSodium: 0,
            totalCholesterol: 0,
        };

        for (const log of logs) {
            if (!log.food_log_items) continue;

            for (const item of log.food_log_items) {
                const food = item.food_items;
                if (!food) continue;

                totals.totalCalories += food.calories || food.energy || 0;
                totals.totalProtein += food.protein || 0;
                totals.totalCarbs += food.carbohydrates || food.carbohydrate || 0;
                totals.totalFat += food.fat || food.total_fat || 0;
                totals.totalFiber += food.fiber || 0;
                totals.totalSugar += food.sugar || 0;
                totals.totalSodium += food.sodium || 0;
                totals.totalCholesterol += food.cholesterol || 0;
            }
        }

        // Round all totals to avoid floating point precision issues
        totals.totalCalories = roundTo2(totals.totalCalories);
        totals.totalProtein = roundTo2(totals.totalProtein);
        totals.totalCarbs = roundTo2(totals.totalCarbs);
        totals.totalFat = roundTo2(totals.totalFat);
        totals.totalFiber = roundTo2(totals.totalFiber);
        totals.totalSugar = roundTo2(totals.totalSugar);
        totals.totalSodium = roundTo2(totals.totalSodium);
        totals.totalCholesterol = roundTo2(totals.totalCholesterol);

        return totals;
    }

    private static getMealTypes(logs: FoodLogWithItems[]): string[] {
        return logs.map(log => {
            if (log.meal_type) return log.meal_type;
            const hour = this.extractHour(log.log_time);
            return this.getMealTypeFromHour(hour);
        });
    }

    private static extractHour(timeStr: string): number {
        const parts = timeStr?.split(':');
        return parts?.[0] ? parseInt(parts[0], 10) : 12;
    }

    private static getMealTypeFromHour(hour: number): string {
        const slot = MEAL_TIME_SLOTS.find(s => hour >= s.start && hour < s.end);
        return slot?.name ?? 'Snack';
    }
}

interface NutritionTotals {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalFiber: number;
    totalSugar: number;
    totalSodium: number;
    totalCholesterol: number;
}

interface HealthInsights {
    healthTags: string[];
    warnings: string[];
    micronutrients: Record<string, number>;
}
