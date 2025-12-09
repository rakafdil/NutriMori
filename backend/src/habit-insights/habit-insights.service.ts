import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase';
import {
    GetHabitInsightDto,
    HabitInsightResponseDto,
    NutrientTrendDto,
    MealTimingPatternDto,
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

        // Calculate date range (default: 3 weeks)
        const endDate = dto.endDate ? new Date(dto.endDate) : new Date();
        const startDate = dto.startDate
            ? new Date(dto.startDate)
            : new Date(endDate.getTime() - 21 * 24 * 60 * 60 * 1000);

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
        const mlInsights = await this.callMLAnalysis(foodLogs, user);

        return {
            userId: dto.userId,
            periodStart: startDate.toISOString(),
            periodEnd: endDate.toISOString(),
            daysAnalyzed: Math.ceil(
                (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
            ),
            totalMeals: foodLogs.length,
            summary: mlInsights.summary,
            recommendations: mlInsights.recommendations,
            patterns: mlInsights.patterns,
            nutrientTrends: analysis.nutrientTrends,
            mealTimings: analysis.mealTimings,
            healthScore: this.calculateHealthScore(analysis, foodLogs),
            generatedAt: new Date().toISOString(),
        };
    }

    private async callMLAnalysis(foodLogs: any[], user: any) {
        try {
            // Prepare data for ML API
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

            // Prepare food logs data
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
                }),
            });

            if (!response.ok) {
                throw new Error(`ML API returned status ${response.status}`);
            }

            const data = await response.json();
            return {
                summary: data.summary || 'Analysis completed',
                recommendations: data.recommendations || [],
                patterns: data.patterns || [],
            };
        } catch (error) {
            console.error('ML API call failed:', error);
            // Fallback to basic analysis if ML API is unavailable
            return this.generateBasicInsights(foodLogs, user);
        }
    }

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
                if (mealType === 'dinner') return hour >= 17 && hour < 22;
                return hour >= 15 && hour < 17;
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
            let bucket = dailyData.get(date);
            if (!bucket) {
                bucket = [];
                dailyData.set(date, bucket);
            }
            bucket.push(log);
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
        type InsightPattern = {
            pattern: string;
            frequency: string;
            impact: string;
            description: string;
        };
        const patterns: InsightPattern[] = [];

        if (avgMealsPerDay < 3) {
            recommendations.push('Increase meal frequency to 3-4 times per day');
            patterns.push({
                pattern: 'Low meal frequency',
                frequency: 'Daily',
                impact: 'High',
                description: `Averaging ${avgMealsPerDay.toFixed(1)} meals per day`,
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
        if (consistency >= 60) return 'Moderately consistent';
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