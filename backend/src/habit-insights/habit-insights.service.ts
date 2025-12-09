import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase';
import {
    GetHabitInsightDto,
    HabitInsightResponseDto,
    HabitPatternDto,
    NutrientTrendDto,
    MealTimingPatternDto,
    PeriodType,
} from './dto';

@Injectable()
export class HabitInsightsService {
    private mlApiUrl: string;

    constructor(
        private supabaseService: SupabaseService,
        private configService: ConfigService,
    ) {
        this.mlApiUrl = this.configService.get<string>('ML_API_URL') || 'http://localhost:5000';
    }

    private get supabase() {
        return this.supabaseService.getClient();
    }

    async generateInsight(dto: GetHabitInsightDto): Promise<HabitInsightResponseDto> {
        // Verify user exists
        const { data: user, error: userError } = await this.supabase
            .from('users')
            .select('*, user_preferences(*)')
            .eq('id', dto.userId)
            .single();

        if (userError || !user) {
            throw new NotFoundException(`User with ID ${dto.userId} not found`);
        }

        // Calculate date range based on period
        const { startDate, endDate } = this.calculateDateRange(dto);

        // Fetch food logs for the period
        const { data: foodLogs, error: logsError } = await this.supabase
            .from('user_food_logs')
            .select(
                `
                *,
                food_items(*),
                nutrition_rules(*)
            `,
            )
            .eq('user_id', dto.userId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: true });

        if (logsError) throw logsError;

        if (!foodLogs || foodLogs.length === 0) {
            throw new NotFoundException(
                `No food logs found for user ${dto.userId} in the specified period`,
            );
        }

        // Analyze local data
        const analysis = this.analyzeLocalData(foodLogs, user);

        // Get ML insights from Python API
        const mlInsights = await this.callMLAnalysis(foodLogs, user, dto.period);

        // Calculate average calories
        const totalCalories = foodLogs.reduce(
            (sum, log) => sum + (log.nutrients?.calories || 0),
            0,
        );
        const uniqueDates = new Set(
            foodLogs.map((log) => new Date(log.created_at).toISOString().split('T')[0]),
        ).size;
        const averageCalories = Math.round(totalCalories / uniqueDates);

        // Enhanced patterns with positive/negative classification
        const enhancedPatterns = this.enhancePatterns(
            mlInsights.patterns,
            foodLogs,
            analysis,
            user,
        );

        const daysAnalyzed = Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        return {
            userId: dto.userId,
            period: dto.period,
            dateRange: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0],
            },
            daysAnalyzed,
            totalMeals: foodLogs.length,
            averageCalories,
            patterns: enhancedPatterns,
            summary: mlInsights.summary,
            recommendations: mlInsights.recommendations,
            nutrientTrends: analysis.nutrientTrends,
            mealTimings: analysis.mealTimings,
            healthScore: this.calculateHealthScore(analysis, foodLogs),
            generatedAt: new Date().toISOString(),
        };
    }

    private calculateDateRange(dto: GetHabitInsightDto): { startDate: Date; endDate: Date } {
        const endDate = dto.endDate ? new Date(dto.endDate) : new Date();
        let startDate: Date;

        if (dto.startDate) {
            startDate = new Date(dto.startDate);
        } else {
            // Auto-calculate based on period
            switch (dto.period) {
                case PeriodType.WEEKLY:
                    startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case PeriodType.MONTHLY:
                    startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case PeriodType.YEARLY:
                    startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                case PeriodType.OVERALL:
                    // Get user's first food log
                    startDate = new Date(endDate.getTime() - 3650 * 24 * 60 * 60 * 1000); // Max 10 years back
                    break;
                default:
                    startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            }
        }

        return { startDate, endDate };
    }

    private enhancePatterns(
        mlPatterns: any[],
        foodLogs: any[],
        analysis: any,
        user: any,
    ): HabitPatternDto[] {
        const patterns: HabitPatternDto[] = [];

        // Process ML patterns
        mlPatterns.forEach((pattern) => {
            patterns.push({
                type: this.determinePatternType(pattern),
                message: pattern.pattern || pattern.message,
                frequency: pattern.frequency,
                impact: pattern.impact,
            });
        });

        // Detect weekend overeating pattern
        const weekendPattern = this.detectWeekendPattern(foodLogs);
        if (weekendPattern) {
            patterns.push(weekendPattern);
        }

        // Detect vegetable consistency (positive pattern)
        const vegPattern = this.detectVegetableConsistency(foodLogs);
        if (vegPattern) {
            patterns.push(vegPattern);
        }

        // Detect breakfast skipping pattern
        const breakfastPattern = this.detectBreakfastPattern(foodLogs);
        if (breakfastPattern) {
            patterns.push(breakfastPattern);
        }

        // Detect sugar intake pattern
        const sugarPattern = this.detectSugarPattern(foodLogs);
        if (sugarPattern) {
            patterns.push(sugarPattern);
        }

        return patterns;
    }

    private determinePatternType(pattern: any): 'positive' | 'negative' | 'neutral' {
        const negativeKeywords = [
            'skip',
            'berlebih',
            'excess',
            'low',
            'late',
            'irregular',
            'inconsistent',
            'kurang',
        ];
        const positiveKeywords = [
            'consistent',
            'balanced',
            'good',
            'regular',
            'adequate',
            'konsisten',
            'baik',
        ];

        const text = (pattern.pattern || pattern.message || '').toLowerCase();

        if (negativeKeywords.some((keyword) => text.includes(keyword))) {
            return 'negative';
        }
        if (positiveKeywords.some((keyword) => text.includes(keyword))) {
            return 'positive';
        }
        return 'neutral';
    }

    private detectWeekendPattern(foodLogs: any[]): HabitPatternDto | null {
        const weekendLogs = foodLogs.filter((log) => {
            const day = new Date(log.created_at).getDay();
            return day === 0 || day === 6; // Sunday or Saturday
        });

        const weekdayLogs = foodLogs.filter((log) => {
            const day = new Date(log.created_at).getDay();
            return day > 0 && day < 6;
        });

        if (weekendLogs.length === 0 || weekdayLogs.length === 0) return null;

        const weekendAvgCalories =
            weekendLogs.reduce((sum, log) => sum + (log.nutrients?.calories || 0), 0) /
            weekendLogs.length;
        const weekdayAvgCalories =
            weekdayLogs.reduce((sum, log) => sum + (log.nutrients?.calories || 0), 0) /
            weekdayLogs.length;

        // If weekend calories are 20% higher
        if (weekendAvgCalories > weekdayAvgCalories * 1.2) {
            return {
                type: 'negative',
                message: 'Asupan kalori berlebih di akhir pekan',
                daysDetected: ['Saturday', 'Sunday'],
                frequency: 'Weekly',
                impact: 'Medium',
            };
        }

        return null;
    }

    private detectVegetableConsistency(foodLogs: any[]): HabitPatternDto | null {
        const vegetableKeywords = ['sayur', 'vegetable', 'salad', 'bayam', 'kangkung', 'wortel'];
        
        let consecutiveDays = 0;
        let maxStreak = 0;
        let lastDate: string | null = null;

        const logsByDate = new Map<string, any[]>();
        foodLogs.forEach((log) => {
            const date = new Date(log.created_at).toISOString().split('T')[0];
            if (!logsByDate.has(date)) {
                logsByDate.set(date, []);
            }
            logsByDate.get(date)!.push(log);
        });

        const sortedDates = Array.from(logsByDate.keys()).sort();

        sortedDates.forEach((date) => {
            const logs = logsByDate.get(date)!;
            const hasVegetable = logs.some((log) => {
                const text = (log.text || log.normalized_text || '').toLowerCase();
                return vegetableKeywords.some((keyword) => text.includes(keyword));
            });

            if (hasVegetable) {
                consecutiveDays++;
                maxStreak = Math.max(maxStreak, consecutiveDays);
            } else {
                consecutiveDays = 0;
            }
        });

        if (maxStreak >= 5) {
            return {
                type: 'positive',
                message: 'Konsisten makan sayur saat makan siang',
                streak: maxStreak,
                frequency: 'Daily',
                impact: 'High',
            };
        }

        return null;
    }

    private detectBreakfastPattern(foodLogs: any[]): HabitPatternDto | null {
        const logsByDate = new Map<string, any[]>();
        foodLogs.forEach((log) => {
            const date = new Date(log.created_at).toISOString().split('T')[0];
            if (!logsByDate.has(date)) {
                logsByDate.set(date, []);
            }
            logsByDate.get(date)!.push(log);
        });

        let daysWithoutBreakfast = 0;
        const skippedDays: string[] = [];

        logsByDate.forEach((logs, date) => {
            const hasBreakfast = logs.some((log) => {
                const hour = new Date(log.created_at).getHours();
                return hour >= 5 && hour <= 10; // Breakfast time window
            });

            if (!hasBreakfast) {
                daysWithoutBreakfast++;
                const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
                skippedDays.push(dayName);
            }
        });

        const skipPercentage = (daysWithoutBreakfast / logsByDate.size) * 100;

        if (skipPercentage > 30) {
            return {
                type: 'negative',
                message: 'Sering melewatkan sarapan',
                daysDetected: [...new Set(skippedDays)].slice(0, 3),
                frequency: `${Math.round(skipPercentage)}% of days`,
                impact: 'High',
            };
        }

        return null;
    }

    private detectSugarPattern(foodLogs: any[]): HabitPatternDto | null {
        const sugarKeywords = ['gula', 'sugar', 'manis', 'sweet', 'cake', 'candy', 'soda'];
        
        const weekendLogs = foodLogs.filter((log) => {
            const day = new Date(log.created_at).getDay();
            return day === 0 || day === 6;
        });

        const weekendSugarLogs = weekendLogs.filter((log) => {
            const text = (log.text || log.normalized_text || '').toLowerCase();
            return sugarKeywords.some((keyword) => text.includes(keyword));
        });

        const sugarPercentage = (weekendSugarLogs.length / weekendLogs.length) * 100;

        if (sugarPercentage > 40 && weekendLogs.length > 5) {
            return {
                type: 'negative',
                message: 'Asupan gula berlebih di akhir pekan',
                daysDetected: ['Saturday', 'Sunday'],
                frequency: 'Weekly',
                impact: 'High',
            };
        }

        return null;
    }

    private async callMLAnalysis(foodLogs: any[], user: any, period: PeriodType) {
        try {
            const userProfile = {
                username: user.username,
                age: user.age,
                height_cm: user.height_cm,
                weight_kg: user.weight_kg,
                goals: user.user_preferences?.[0]?.goals,
                allergies: user.user_preferences?.[0]?.allergies,
                tastes: user.user_preferences?.[0]?.tastes,
                medical_history: user.user_preferences?.[0]?.medical_history,
            };

            const logsData = foodLogs.map((log) => ({
                id: log.id,
                text: log.text || log.normalized_text,
                normalized_text: log.normalized_text,
                nutrients: log.nutrients,
                created_at: log.created_at,
                food_item_id: log.food_item_id,
            }));

            const response = await fetch(`${this.mlApiUrl}/analyze-habits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    food_logs: logsData,
                    user_profile: userProfile,
                    period: period,
                }),
            });

            if (!response.ok) {
                throw new Error(`ML API responded with status ${response.status}`);
            }

            const data = await response.json();
            return {
                summary: data.summary || 'Analysis completed',
                recommendations: data.recommendations || [],
                patterns: data.patterns || [],
            };
        } catch (error) {
            console.error('ML API call failed:', error);
            return this.generateBasicInsights(foodLogs, user);
        }
    }

    // Keep existing methods: analyzeLocalData, analyzeNutrientTrends, analyzeMealTimings, 
    // calculateDailyStats, generateBasicInsights, calculateRecommendations, calculateTrend,
    // calculateConsistency, getMealTimingNote, calculateHealthScore

    private analyzeLocalData(foodLogs: any[], user: any) {
        const nutrientTrends = this.analyzeNutrientTrends(foodLogs, user);
        const mealTimings = this.analyzeMealTimings(foodLogs);
        const dailyStats = this.calculateDailyStats(foodLogs);

        return {
            nutrientTrends,
            mealTimings,
            dailyStats,
        };
    }

    private analyzeNutrientTrends(foodLogs: any[], user: any): NutrientTrendDto[] {
        const nutrients = ['calories', 'protein', 'carbohydrates', 'fat', 'fiber'];
        const trends: NutrientTrendDto[] = [];

        const recommendations = this.calculateRecommendations(user);

        for (const nutrient of nutrients) {
            const values = foodLogs
                .filter((log) => log.nutrients && log.nutrients[nutrient])
                .map((log) => log.nutrients[nutrient]);

            if (values.length === 0) continue;

            const average = values.reduce((a, b) => a + b, 0) / values.length;
            const trend = this.calculateTrend(values);
            const recommended = recommendations[nutrient] || 0;

            let status: 'Below target' | 'On target' | 'Above target';
            if (average < recommended * 0.9) status = 'Below target';
            else if (average > recommended * 1.1) status = 'Above target';
            else status = 'On target';

            trends.push({
                nutrient: nutrient.charAt(0).toUpperCase() + nutrient.slice(1),
                averageDaily: Math.round(average * 100) / 100,
                trend,
                recommended,
                status,
            });
        }

        return trends;
    }

    private analyzeMealTimings(foodLogs: any[]): MealTimingPatternDto[] {
        const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        const timings: MealTimingPatternDto[] = [];

        for (const mealType of mealTypes) {
            const mealsOfType = foodLogs.filter((log) => {
                const hour = new Date(log.created_at).getHours();
                if (mealType === 'breakfast') return hour >= 5 && hour < 11;
                if (mealType === 'lunch') return hour >= 11 && hour < 15;
                if (mealType === 'dinner') return hour >= 17 && hour < 21;
                return (hour >= 15 && hour < 17) || hour >= 21 || hour < 5;
            });

            if (mealsOfType.length === 0) continue;

            const avgMinutes =
                mealsOfType.reduce((sum, log) => {
                    const date = new Date(log.created_at);
                    return sum + date.getHours() * 60 + date.getMinutes();
                }, 0) / mealsOfType.length;

            const hours = Math.floor(avgMinutes / 60);
            const minutes = Math.round(avgMinutes % 60);
            const avgTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

            const times = mealsOfType.map((log) => {
                const date = new Date(log.created_at);
                return date.getHours() * 60 + date.getMinutes();
            });
            const consistency = this.calculateConsistency(times);

            timings.push({
                mealType: mealType.charAt(0).toUpperCase() + mealType.slice(1),
                averageTime: avgTime,
                consistency,
                note: this.getMealTimingNote(consistency),
            });
        }

        return timings;
    }

    private calculateDailyStats(foodLogs: any[]) {
        const dailyData = new Map<string, any[]>();

        foodLogs.forEach((log) => {
            const date = new Date(log.created_at).toISOString().split('T')[0];
            if (!dailyData.has(date)) {
                dailyData.set(date, []);
            }
            dailyData.get(date)!.push(log);
        });

        return Array.from(dailyData.entries()).map(([date, logs]) => ({
            date,
            mealCount: logs.length,
            totalCalories: logs.reduce(
                (sum, log) => sum + (log.nutrients?.calories || 0),
                0,
            ),
        }));
    }

    private generateBasicInsights(foodLogs: any[], user: any) {
        const totalMeals = foodLogs.length;
        const uniqueDates = new Set(
            foodLogs.map((log) => new Date(log.created_at).toISOString().split('T')[0]),
        ).size;

        const avgMealsPerDay = totalMeals / uniqueDates;

        const recommendations: string[] = [];
        const patterns: any[] = [];

        if (avgMealsPerDay < 3) {
            recommendations.push('Try to have at least 3 meals per day');
            patterns.push({
                pattern: 'Infrequent meal logging',
                frequency: 'Daily',
                impact: 'Medium',
                description: 'Not logging enough meals per day',
            });
        }

        recommendations.push('Continue tracking your meals consistently');
        recommendations.push('Maintain balanced nutrition with variety');

        return {
            summary: `Analyzed ${totalMeals} meals over ${uniqueDates} days. ${patterns.length > 0 ? 'Some patterns need attention.' : 'Good consistency in meal tracking.'}`,
            recommendations,
            patterns,
        };
    }

    private calculateRecommendations(user: any): Record<string, number> {
        const weight = user.weight_kg || 70;
        const height = user.height_cm || 170;
        const age = user.age || 25;

        const bmr = 10 * weight + 6.25 * height - 5 * age + 5;

        return {
            calories: Math.round(bmr * 1.5),
            protein: Math.round(weight * 1.6),
            carbohydrates: Math.round((bmr * 1.5 * 0.5) / 4),
            fat: Math.round((bmr * 1.5 * 0.3) / 9),
            fiber: 30,
        };
    }

    private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
        if (values.length < 2) return 'stable';

        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        const change = ((secondAvg - firstAvg) / firstAvg) * 100;

        if (change > 10) return 'increasing';
        if (change < -10) return 'decreasing';
        return 'stable';
    }

    private calculateConsistency(times: number[]): number {
        if (times.length < 2) return 100;

        const mean = times.reduce((a, b) => a + b, 0) / times.length;
        const variance =
            times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length;
        const stdDev = Math.sqrt(variance);

        const maxStdDev = 120;
        const score = Math.max(0, 100 - (stdDev / maxStdDev) * 100);

        return Math.round(score);
    }

    private getMealTimingNote(consistency: number): string {
        if (consistency >= 80) return 'Very consistent meal timing';
        if (consistency >= 60) return 'Moderately consistent meal timing';
        return 'Inconsistent meal timing - consider establishing a routine';
    }

    private calculateHealthScore(analysis: any, foodLogs: any[]): number {
        let score = 0;

        // Nutrient balance (40 points)
        const onTarget = analysis.nutrientTrends.filter(
            (t) => t.status === 'On target',
        ).length;
        score += (onTarget / analysis.nutrientTrends.length) * 40;

        // Meal consistency (30 points)
        const avgConsistency =
            analysis.mealTimings.reduce((sum, m) => sum + m.consistency, 0) /
            analysis.mealTimings.length;
        score += (avgConsistency / 100) * 30;

        // Meal frequency (30 points)
        const uniqueDates = new Set(
            foodLogs.map((log) => new Date(log.created_at).toISOString().split('T')[0]),
        ).size;
        const avgMealsPerDay = foodLogs.length / uniqueDates;
        const frequencyScore = Math.min((avgMealsPerDay / 4) * 30, 30);
        score += frequencyScore;

        return Math.round(score);
    }
}