import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase';
import { DEFAULT_USER_TARGETS, MEAL_TIME_SLOTS } from './constants';
import {
  GetHabitInsightDto,
  HabitInsightResponseDto,
  HabitPatternDto,
  MealTimingPatternDto,
  NutrientTrendDto,
  PeriodType,
} from './dto';
import {
  CacheManager,
  DataAggregator,
  GeminiClient,
  HealthScoreCalculator,
  NutrientAnalyzer,
  PatternDetector,
  ToonSerializer,
} from './helpers';
import {
  AggregatedDayData,
  CachedInsight,
  NutritionAnalysisRecord,
  UserTargets,
} from './types';

/**
 * Habit Insights Service
 * 
 * Generates insights from user's eating habits using:
 * - Rule-based pattern detection
 * - Nutrient trend analysis
 * - AI-powered summaries (Gemini with TOON format)
 * - Intelligent caching
 */
@Injectable()
export class HabitInsightsService {
    private readonly logger = new Logger(HabitInsightsService.name);
    private readonly cacheManager: CacheManager;
    private readonly geminiClient: GeminiClient;

    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly configService: ConfigService,
    ) {
        const supabase = this.supabaseService.getClient();
        this.cacheManager = new CacheManager(supabase);
        
        const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
        this.geminiClient = new GeminiClient(apiKey);
    }

    /**
     * Main entry point - generates habit insight for a user
     */
    async generateInsight(
        params: GetHabitInsightDto & { userId: string }
    ): Promise<HabitInsightResponseDto> {
        const { userId, period, startDate, endDate } = params;

        // Calculate date range
        const dateRange = this.calculateDateRange(period, startDate, endDate);

        // Fetch nutrition analysis data (from nutrition_analysis table)
        const nutritionData = await this.fetchNutritionAnalysis(userId, dateRange);

        if (nutritionData.length === 0) {
            return this.buildEmptyResponse(userId, period, dateRange);
        }

        // Aggregate data per day
        const aggregatedData = this.aggregateData(nutritionData);

        // Generate data hash for cache validation
        const dataHash = CacheManager.generateDataHash(aggregatedData);

        // Check cache
        const cached = await this.checkCache(userId, period, dateRange, dataHash, aggregatedData.length);
        if (cached) {
            return cached;
        }

        // Get user targets
        const targets = await this.getUserTargets(userId);

        // Perform analysis
        const analysis = await this.performAnalysis(aggregatedData, targets, period);

        // Save to cache
        await this.saveAnalysisToCache(userId, period, dateRange, dataHash, aggregatedData, analysis);

        // Build response
        return this.buildResponse(userId, period, dateRange, aggregatedData, analysis);
    }

    // ============ DATE RANGE ============

    private calculateDateRange(
        period: PeriodType,
        startDate?: string,
        endDate?: string
    ): { start: string; end: string } {
        const end = endDate ? new Date(endDate) : new Date();
        let start: Date;

        if (startDate) {
            start = new Date(startDate);
        } else {
            start = new Date(end);
            const periodOffsets: Record<PeriodType, () => void> = {
                [PeriodType.WEEKLY]: () => start.setDate(start.getDate() - 7),
                [PeriodType.MONTHLY]: () => start.setMonth(start.getMonth() - 1),
                [PeriodType.YEARLY]: () => start.setFullYear(start.getFullYear() - 1),
                [PeriodType.OVERALL]: () => start.setFullYear(start.getFullYear() - 5),
            };
            periodOffsets[period]();
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
        };
    }

    // ============ DATA FETCHING FROM NUTRITION_ANALYSIS ============

    /**
     * Fetch nutrition analysis data for a user within date range
     * This uses pre-computed data from nutrition_analysis table
     */
    private async fetchNutritionAnalysis(
        userId: string,
        dateRange: { start: string; end: string }
    ): Promise<NutritionAnalysisRecord[]> {
        const supabase = this.supabaseService.getClient();

        // Convert date strings to Date objects for comparison
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // Include the entire end day

        const { data, error } = await supabase
            .from('nutrition_analysis')
            .select(`
                id,
                food_log_id,
                user_id,
                total_calories,
                total_protein,
                total_carbs,
                total_fat,
                total_sugar,
                total_fiber,
                total_sodium,
                total_cholesterol,
                micronutrients,
                health_tags,
                warnings,
                created_at,
                updated_at,
                food_logs!inner(
                    log_id,
                    user_id,
                    meal_type,
                    created_at
                )
            `)
            .eq('user_id', userId)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: true });

        if (error) {
            this.logger.error(`Failed to fetch nutrition analysis: ${error.message}`);
            return [];
        }

        if (!data?.length) {
            this.logger.debug(`No nutrition analysis data found for user ${userId} from ${dateRange.start} to ${dateRange.end}`);
            return [];
        }

        this.logger.debug(`Found ${data.length} nutrition analysis records for user ${userId}`);
        return data as NutritionAnalysisRecord[];
    }

    // ============ DATA AGGREGATION ============

    private aggregateData(nutritionData: NutritionAnalysisRecord[]): AggregatedDayData[] {
        return DataAggregator.aggregateFromNutritionAnalysis(nutritionData);
    }

    // ============ USER TARGETS ============

    private async getUserTargets(userId: string): Promise<UserTargets> {
        const supabase = this.supabaseService.getClient();

        // Get user profile
        const { data: user } = await supabase
            .from('users')
            .select('age, weight_kg, height_cm')
            .eq('id', userId)
            .single();

        // Get AKG data
        const { data: akgRows } = await supabase.from('dataset_akg').select('*');

        const akg = this.findMatchingAkg(akgRows, user?.age);

        return {
            calories: akg?.energi_kkal || DEFAULT_USER_TARGETS.calories,
            protein: akg?.protein_g || DEFAULT_USER_TARGETS.protein,
            carbs: akg?.karbohidrat_g || DEFAULT_USER_TARGETS.carbs,
            fat: akg?.lemak_total_g || DEFAULT_USER_TARGETS.fat,
            sugar: DEFAULT_USER_TARGETS.sugar,
            fiber: akg?.serat_g || DEFAULT_USER_TARGETS.fiber,
            sodium: akg?.natrium_mg || DEFAULT_USER_TARGETS.sodium,
        };
    }

    private findMatchingAkg(akgRows: any[] | null, age: number | undefined): any {
        if (!akgRows?.length) return null;

        const userAge = age || 25;

        return akgRows.find((row: any) => {
            const range = String(row.umur || '');
            if (range.includes('+')) return userAge >= parseInt(range);
            const parts = range.split('-');
            if (parts.length === 2) {
                return userAge >= parseInt(parts[0]) && userAge <= parseInt(parts[1]);
            }
            return false;
        }) || akgRows.find((r: any) => r.umur?.includes('19-29')) || akgRows[0];
    }

    // ============ CACHE OPERATIONS ============

    private async checkCache(
        userId: string,
        period: PeriodType,
        dateRange: { start: string; end: string },
        dataHash: string,
        daysAnalyzed: number
    ): Promise<HabitInsightResponseDto | null> {
        const cached = await this.cacheManager.getCachedInsight(
            userId,
            period as any,
            { start: new Date(dateRange.start), end: new Date(dateRange.end) },
            dataHash
        );

        if (cached) {
            this.logger.debug(`Cache hit for user ${userId}, period ${period}`);
            return this.buildCachedResponse(userId, period, dateRange, cached, daysAnalyzed);
        }

        return null;
    }

    private async saveAnalysisToCache(
        userId: string,
        period: PeriodType,
        dateRange: { start: string; end: string },
        dataHash: string,
        aggregatedData: AggregatedDayData[],
        analysis: AnalysisResult
    ): Promise<void> {
        await this.cacheManager.saveToCache(
            userId,
            period as any,
            { start: new Date(dateRange.start), end: new Date(dateRange.end) },
            analysis.patterns as any,
            analysis.nutrientTrends,
            analysis.summary,
            analysis.recommendations,
            analysis.healthScore,
            dataHash
        );
    }

    // ============ ANALYSIS ============

    private async performAnalysis(
        data: AggregatedDayData[],
        targets: UserTargets,
        period: PeriodType
    ): Promise<AnalysisResult> {
        // Detect patterns using rule engine
        const patterns = PatternDetector.detectPatterns(data, targets);

        // Calculate nutrient trends
        const nutrientTrends = NutrientAnalyzer.calculateTrends(data, targets);

        // Analyze meal timing
        const mealTimings = this.analyzeMealTiming(data);

        // Calculate health score
        const healthScore = HealthScoreCalculator.calculate(
            data,
            patterns as any,
            {
                dailyCalories: targets.calories,
                dailyProtein: targets.protein,
                dailyCarbs: targets.carbs,
                dailyFat: targets.fat,
            }
        );

        // Generate AI insights
        const aiResult = await this.generateAiSummary(data, patterns, nutrientTrends, targets, period);

        return {
            patterns,
            nutrientTrends,
            mealTimings,
            healthScore: aiResult.healthScore ?? healthScore,
            summary: aiResult.summary,
            recommendations: aiResult.recommendations,
        };
    }

    // ============ MEAL TIMING ANALYSIS ============

    private analyzeMealTiming(data: AggregatedDayData[]): MealTimingPatternDto[] {
        if (data.length === 0) return [];

        const mealSlots = this.initializeMealSlots();

        // Collect meal times
        for (const day of data) {
            for (const mealType of day.mealTypes) {
                this.categorizeMealTime(mealSlots, mealType);
            }
        }

        return this.calculateMealTimingStats(mealSlots);
    }

    private initializeMealSlots(): Map<string, { start: number; end: number; times: number[] }> {
        const slots = new Map();
        for (const slot of MEAL_TIME_SLOTS) {
            slots.set(slot.name, { start: slot.start, end: slot.end, times: [] });
        }
        return slots;
    }

    private categorizeMealTime(
        slots: Map<string, { start: number; end: number; times: number[] }>,
        mealType: string
    ): void {
        // Map meal type to approximate hour
        const mealTypeHours: Record<string, number> = {
            'breakfast': 8,
            'lunch': 12,
            'dinner': 19,
            'snack': 15,
        };

        const hour = mealTypeHours[mealType.toLowerCase()] || 12;

        for (const [name, slot] of slots.entries()) {
            if (hour >= slot.start && hour < slot.end) {
                slot.times.push(hour);
                break;
            }
        }
    }

    private calculateMealTimingStats(
        slots: Map<string, { start: number; end: number; times: number[] }>
    ): MealTimingPatternDto[] {
        return Array.from(slots.entries()).map(([mealType, slot]) => {
            if (slot.times.length === 0) {
                return {
                    mealType,
                    averageTime: '-',
                    consistency: 0,
                    note: `Tidak ada data ${mealType.toLowerCase()}`,
                };
            }

            const avg = slot.times.reduce((a, b) => a + b, 0) / slot.times.length;
            const variance = slot.times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / slot.times.length;
            const stdDev = Math.sqrt(variance);
            const consistency = Math.max(0, Math.min(100, Math.round(100 - stdDev * 20)));

            const avgHour = Math.floor(avg);
            const avgMinute = Math.round((avg - avgHour) * 60);

            return {
                mealType,
                averageTime: `${String(avgHour).padStart(2, '0')}:${String(avgMinute).padStart(2, '0')}`,
                consistency,
                note: this.getConsistencyNote(consistency),
            };
        });
    }

    private getConsistencyNote(consistency: number): string {
        if (consistency >= 80) return 'Sangat konsisten';
        if (consistency >= 60) return 'Cukup konsisten';
        return 'Waktu makan bervariasi';
    }

    // ============ AI INSIGHTS ============

    private async generateAiSummary(
        data: AggregatedDayData[],
        patterns: HabitPatternDto[],
        trends: NutrientTrendDto[],
        targets: UserTargets,
        period: PeriodType
    ): Promise<{ summary: string; recommendations: string[]; healthScore?: number }> {
        // Prepare TOON format data
        const toonData = ToonSerializer.serializeDayData(data);
        const toonPatterns = ToonSerializer.serializePatterns(patterns);
        const toonTrends = ToonSerializer.serializeTrends(trends);

        const avgCalories = data.reduce((sum, d) => sum + (d.totalCalories || 0), 0) / Math.max(1, data.length);

        // Collect all health tags and warnings from aggregated data
        const allHealthTags = new Set<string>();
        const allWarnings = new Set<string>();
        for (const day of data) {
            for (const tag of day.healthTags || []) allHealthTags.add(tag);
            for (const warning of day.warnings || []) allWarnings.add(warning);
        }

        // Generate insights using Gemini with health insights from nutrition_analysis
        return await this.geminiClient.generateInsights(
            toonData,
            toonPatterns,
            toonTrends,
            {
                period: period.toUpperCase(),
                daysCount: data.length,
                avgCalories: Math.round(avgCalories),
                targetCalories: targets.calories,
                healthTags: Array.from(allHealthTags),
                warnings: Array.from(allWarnings),
            },
            patterns,
            trends
        );
    }

    // ============ RESPONSE BUILDERS ============

    private buildResponse(
        userId: string,
        period: PeriodType,
        dateRange: { start: string; end: string },
        data: AggregatedDayData[],
        analysis: AnalysisResult
    ): HabitInsightResponseDto {
        const totalMeals = data.reduce((sum, d) => sum + d.mealCount, 0);
        const avgCalories = data.length > 0
            ? Math.round(data.reduce((sum, d) => sum + (d.totalCalories || 0), 0) / data.length)
            : 0;

        return {
            userId,
            period,
            dateRange: { start: dateRange.start, end: dateRange.end },
            daysAnalyzed: data.length,
            totalMeals,
            averageCalories: avgCalories,
            patterns: analysis.patterns,
            nutrientTrends: analysis.nutrientTrends,
            mealTimings: analysis.mealTimings,
            summary: analysis.summary,
            recommendations: analysis.recommendations,
            healthScore: analysis.healthScore,
            generatedAt: new Date().toISOString(),
        };
    }

    private buildCachedResponse(
        userId: string,
        period: PeriodType,
        dateRange: { start: string; end: string },
        cached: CachedInsight,
        daysAnalyzed: number
    ): HabitInsightResponseDto {
        return {
            userId,
            period,
            dateRange: { start: dateRange.start, end: dateRange.end },
            daysAnalyzed: cached.days_analyzed ?? daysAnalyzed,
            totalMeals: cached.total_meals ?? 0,
            averageCalories: cached.average_calories ?? 0,
            patterns: cached.patterns as unknown as HabitPatternDto[],
            nutrientTrends: cached.nutrient_trends as NutrientTrendDto[],
            mealTimings: (cached.meal_timings ?? []) as MealTimingPatternDto[],
            summary: cached.summary,
            recommendations: cached.recommendations,
            healthScore: cached.health_score,
            generatedAt: new Date().toISOString(),
        };
    }

    private buildEmptyResponse(
        userId: string,
        period: PeriodType,
        dateRange: { start: string; end: string }
    ): HabitInsightResponseDto {
        return {
            userId,
            period,
            dateRange: { start: dateRange.start, end: dateRange.end },
            daysAnalyzed: 0,
            totalMeals: 0,
            averageCalories: 0,
            patterns: [],
            nutrientTrends: [],
            mealTimings: [],
            summary: 'Belum ada data makanan untuk periode ini.',
            recommendations: ['Mulai catat makanan Anda untuk mendapatkan insight kesehatan.'],
            healthScore: 0,
            generatedAt: new Date().toISOString(),
        };
    }

    // ============ CACHE INVALIDATION ============

    /**
     * Invalidate cache for a user
     * @returns Number of deleted cache entries
     */
    async invalidateCache(userId: string, period?: PeriodType): Promise<number> {
        const supabase = this.supabaseService.getClient();

        let query = supabase
            .from('habit_insights_cache')
            .delete()
            .eq('user_id', userId);

        if (period) {
            query = query.eq('period', period);
        }

        const { data, error } = await query.select('id');

        if (error) {
            this.logger.error(`Failed to invalidate cache: ${error.message}`);
            return 0;
        }

        return data?.length || 0;
    }

    // ============ HEALTH SCORE HISTORY ============

    /**
     * Get health score history for a user
     */
    async getHealthScoreHistory(
        userId: string,
        months: number
    ): Promise<{
        history: Array<{ month: string; score: number; trend: string }>;
        currentScore: number;
        averageScore: number;
        improvement: number;
    }> {
        const history: Array<{ month: string; score: number; trend: string }> = [];
        const today = new Date();

        // Generate monthly scores for the requested period
        for (let i = months - 1; i >= 0; i--) {
            const monthDate = new Date(today);
            monthDate.setMonth(today.getMonth() - i);

            const monthStr = monthDate.toISOString().slice(0, 7); // YYYY-MM
            const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

            // Fetch nutrition analysis for this month
            const dateRange = {
                start: startOfMonth.toISOString().split('T')[0],
                end: endOfMonth.toISOString().split('T')[0],
            };

            const nutritionData = await this.fetchNutritionAnalysis(userId, dateRange);

            if (nutritionData.length > 0) {
                const aggregatedData = this.aggregateData(nutritionData);
                const targets = await this.getUserTargets(userId);
                const patterns = PatternDetector.detectPatterns(aggregatedData, targets);

                const score = HealthScoreCalculator.calculate(
                    aggregatedData,
                    patterns as any,
                    {
                        dailyCalories: targets.calories,
                        dailyProtein: targets.protein,
                        dailyCarbs: targets.carbs,
                        dailyFat: targets.fat,
                    }
                );

                const prevScore = history.length > 0 ? history[history.length - 1].score : score;
                const trend = score > prevScore ? 'increasing' : score < prevScore ? 'decreasing' : 'stable';

                history.push({ month: monthStr, score, trend });
            }
        }

        // Calculate summary stats
        const scores = history.map(h => h.score);
        const currentScore = scores.length > 0 ? scores[scores.length - 1] : 0;
        const averageScore = scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
            : 0;
        const improvement = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : 0;

        return {
            history,
            currentScore,
            averageScore,
            improvement,
        };
    }
}

// ============ INTERNAL TYPES ============

interface AnalysisResult {
    patterns: HabitPatternDto[];
    nutrientTrends: NutrientTrendDto[];
    mealTimings: MealTimingPatternDto[];
    healthScore: number;
    summary: string;
    recommendations: string[];
}
