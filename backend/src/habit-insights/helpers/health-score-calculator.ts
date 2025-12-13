import { HEALTH_SCORE_CONFIG } from '../constants';
import { AggregatedDayData, PatternDto } from '../types';

/**
 * Health Score Calculator
 * 
 * Calculates overall health score based on eating patterns and nutrient intake.
 */

interface UserTargets {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFat: number;
}

export class HealthScoreCalculator {
    /**
     * Calculate overall health score (0-100)
     */
    static calculate(
        data: AggregatedDayData[],
        patterns: PatternDto[],
        targets: UserTargets,
    ): number {
        const scores = [
            this.calculateConsistencyScore(data),
            this.calculateBalanceScore(data, targets),
            this.calculatePatternScore(patterns),
            this.calculateCompletionScore(data),
        ];

        const weights = HEALTH_SCORE_CONFIG.weights;
        const weightedScore =
            scores[0] * weights.consistency +
            scores[1] * weights.balance +
            scores[2] * weights.patterns +
            scores[3] * weights.completion;

        return Math.round(Math.max(0, Math.min(100, weightedScore)));
    }

    /**
     * Score based on meal consistency (regularity)
     */
    private static calculateConsistencyScore(data: AggregatedDayData[]): number {
        if (data.length < 2) return 50;

        const mealCounts = data.map(d => d.mealCount);
        const avgMeals = mealCounts.reduce((a, b) => a + b, 0) / mealCounts.length;
        const variance = mealCounts.reduce((sum, m) => sum + Math.pow(m - avgMeals, 2), 0) / mealCounts.length;
        const stdDev = Math.sqrt(variance);

        // Lower std dev = more consistent = higher score
        const consistencyRatio = 1 - Math.min(stdDev / avgMeals, 1);
        return consistencyRatio * 100;
    }

    /**
     * Score based on nutrient balance relative to targets
     */
    private static calculateBalanceScore(data: AggregatedDayData[], targets: UserTargets): number {
        if (data.length === 0) return 50;

        const avgCalories = this.calculateAverage(data.map(d => d.totalCalories));
        const avgProtein = this.calculateAverage(data.map(d => d.totalProtein));
        const avgCarbs = this.calculateAverage(data.map(d => d.totalCarbs));
        const avgFat = this.calculateAverage(data.map(d => d.totalFat));

        const scores = [
            this.calculateTargetScore(avgCalories, targets.dailyCalories),
            this.calculateTargetScore(avgProtein, targets.dailyProtein),
            this.calculateTargetScore(avgCarbs, targets.dailyCarbs),
            this.calculateTargetScore(avgFat, targets.dailyFat),
        ];

        return scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    /**
     * Score based on detected patterns (positive vs negative)
     */
    private static calculatePatternScore(patterns: PatternDto[]): number {
        if (patterns.length === 0) return 70;

        const positivePatterns = patterns.filter(p => p.impact === 'positive').length;
        const negativePatterns = patterns.filter(p => p.impact === 'negative').length;
        const neutralPatterns = patterns.filter(p => p.impact === 'neutral').length;

        const total = patterns.length;
        const score =
            (positivePatterns * 100 + neutralPatterns * 70 + negativePatterns * 30) / total;

        return score;
    }

    /**
     * Score based on data completeness
     */
    private static calculateCompletionScore(data: AggregatedDayData[]): number {
        if (data.length === 0) return 0;

        const daysWithMeals = data.filter(d => d.mealCount > 0).length;
        const completionRatio = daysWithMeals / data.length;

        // Bonus for having 3+ meals per day
        const daysWithFullMeals = data.filter(d => d.mealCount >= 3).length;
        const fullMealBonus = (daysWithFullMeals / data.length) * 20;

        return Math.min(100, completionRatio * 80 + fullMealBonus);
    }

    /**
     * Calculate how close a value is to target
     */
    private static calculateTargetScore(actual: number, target: number): number {
        if (target === 0) return 50;

        const ratio = actual / target;
        const { idealRange } = HEALTH_SCORE_CONFIG;

        // Perfect score if within ideal range
        if (ratio >= idealRange.min && ratio <= idealRange.max) {
            return 100;
        }

        // Decrease score based on distance from ideal
        const distance = ratio < idealRange.min
            ? idealRange.min - ratio
            : ratio - idealRange.max;

        return Math.max(0, 100 - distance * 100);
    }

    /**
     * Calculate average of values
     */
    private static calculateAverage(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }
}
