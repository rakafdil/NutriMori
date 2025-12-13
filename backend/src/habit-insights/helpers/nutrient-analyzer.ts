import { NUTRIENT_CONFIG, TREND_THRESHOLDS } from '../constants';
import { NutrientTrendDto } from '../dto';
import { AggregatedDayData, UserTargets } from '../types';

/**
 * Nutrient Analyzer
 * 
 * Calculates nutrient trends from aggregated data.
 */

type TrendDirection = 'increasing' | 'decreasing' | 'stable';
type TargetStatus = 'Below target' | 'On target' | 'Above target';

export class NutrientAnalyzer {
    /**
     * Calculate trends for all configured nutrients
     */
    static calculateTrends(data: AggregatedDayData[], targets: UserTargets): NutrientTrendDto[] {
        if (data.length < 2) return [];

        return NUTRIENT_CONFIG.map(({ key, name, targetKey }) => {
            const values = data.map(d => d[key as keyof AggregatedDayData] as number);
            const target = targets[targetKey as keyof UserTargets];

            const avg = this.calculateAverage(values);
            const trend = this.calculateTrend(values);
            const status = this.calculateStatus(avg, target);

            return {
                nutrient: name,
                averageDaily: Math.round(avg * 10) / 10,
                trend,
                recommended: target,
                status,
            };
        });
    }

    /**
     * Calculate average of values
     */
    private static calculateAverage(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    /**
     * Calculate trend direction by comparing halves
     */
    private static calculateTrend(values: number[]): TrendDirection {
        if (values.length < 2) return 'stable';

        const mid = Math.floor(values.length / 2);
        const firstHalf = values.slice(0, mid);
        const secondHalf = values.slice(mid);

        const firstAvg = this.calculateAverage(firstHalf);
        const secondAvg = this.calculateAverage(secondHalf);

        if (firstAvg === 0) return 'stable';

        const ratio = secondAvg / firstAvg;

        if (ratio > TREND_THRESHOLDS.increasingRatio) return 'increasing';
        if (ratio < TREND_THRESHOLDS.decreasingRatio) return 'decreasing';
        return 'stable';
    }

    /**
     * Calculate status relative to target
     */
    private static calculateStatus(avg: number, target: number): TargetStatus {
        if (target === 0) return 'On target';

        const ratio = avg / target;

        if (ratio < TREND_THRESHOLDS.belowTargetRatio) return 'Below target';
        if (ratio > TREND_THRESHOLDS.aboveTargetRatio) return 'Above target';
        return 'On target';
    }
}
