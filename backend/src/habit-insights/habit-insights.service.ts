import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase';
import { DEFAULT_USER_TARGETS } from './constants';
import {
    BudgetInsightDto,
    BudgetPatternDto,
    GetHabitInsightDto,
    HabitInsightResponseDto,
    HabitPatternDto,
    PeriodType
} from './dto';
import {
    CacheManager,
    DataAggregator,
    GeminiClient,
    HealthScoreCalculator,
    PatternDetector,
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

        // Safety check: Ensure aggregation produced meaningful data
        if (aggregatedData.length === 0) {
            this.logger.warn(`Aggregation produced empty data for user ${userId}`);
            return this.buildEmptyResponse(userId, period, dateRange);
        }

        // Additional check: Ensure we have meals
        const totalMealsCheck = aggregatedData.reduce((sum, d) => sum + (d.mealCount || 0), 0);
        if (totalMealsCheck === 0) {
            this.logger.warn(`No meals found after aggregation for user ${userId}`);
            return this.buildEmptyResponse(userId, period, dateRange);
        }

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

        // Generate budget insight
        const budgetInsight = await this.generateBudgetInsight(userId, dateRange, aggregatedData);

        // Save to cache
        await this.saveAnalysisToCache(userId, period, dateRange, dataHash, aggregatedData, analysis);

        // Build response
        return this.buildResponse(userId, period, dateRange, aggregatedData, analysis, budgetInsight);
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
     * Falls back to calculating from food_logs if no analysis exists
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

        this.logger.debug(`Fetching nutrition data for user ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

        // Get data from nutrition_analysis table
        // IMPORTANT: Supabase nested column filters are unreliable, so we:
        // 1. Fetch all user data with inner join to food_logs
        // 2. Filter in-memory by food_logs.created_at
        const { data: rawData, error } = await supabase
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
            .eq('user_id', userId);

        if (error) {
            this.logger.error(`Failed to fetch nutrition analysis: ${error.message}`);
            return [];
        }

        // Filter in-memory by food_logs.created_at
        const data = (rawData || []).filter((record: any) => {
            // Handle both array and object food_logs
            const foodLogs = Array.isArray(record.food_logs) ? record.food_logs[0] : record.food_logs;
            
            if (!foodLogs?.created_at) {
                this.logger.warn(`Record ${record.id} missing food_logs.created_at`);
                return false;
            }
            
            // Use UTC for date comparison to avoid timezone issues
            const logDate = new Date(foodLogs.created_at);
            const isInRange = logDate >= startDate && logDate <= endDate;
            
            if (!isInRange) {
                this.logger.debug(`Record ${record.id} date ${logDate.toISOString()} outside range`);
            }
            
            return isInRange;
        }).sort((a: any, b: any) => {
            const foodLogsA = Array.isArray(a.food_logs) ? a.food_logs[0] : a.food_logs;
            const foodLogsB = Array.isArray(b.food_logs) ? b.food_logs[0] : b.food_logs;
            const dateA = new Date(foodLogsA.created_at).getTime();
            const dateB = new Date(foodLogsB.created_at).getTime();
            return dateA - dateB;
        });

        if (data?.length) {
            this.logger.debug(`Found ${data.length} nutrition analysis records for user ${userId} (filtered from ${rawData?.length || 0} total)`);
            return data as NutritionAnalysisRecord[];
        }

        this.logger.debug(`No nutrition_analysis found for user ${userId} in date range`);
        return [];
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
        // Calculate metrics for cache with null safety
        const totalMeals = aggregatedData.reduce((sum, d) => sum + (d.mealCount || 0), 0);
        const avgCalories = aggregatedData.length > 0
            ? Math.round(aggregatedData.reduce((sum, d) => sum + (d.totalCalories || 0), 0) / aggregatedData.length)
            : 0;

        await this.cacheManager.saveToCache(
            userId,
            period as any,
            { start: new Date(dateRange.start), end: new Date(dateRange.end) },
            analysis.patterns as any,
            analysis.summary,
            analysis.recommendations,
            analysis.healthScore,
            dataHash,
            aggregatedData.length,
            totalMeals,
            avgCalories
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

        // Calculate health score locally
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

        // Calculate metrics with null safety
        const totalMeals = data.reduce((sum, d) => sum + (d.mealCount || 0), 0);
        const avgCalories = data.length > 0
            ? Math.round(data.reduce((sum, d) => sum + (d.totalCalories || 0), 0) / data.length)
            : 0;

        // Generate AI summary and recommendations only (healthScore already calculated)
        const aiResult = await this.generateAiSummary(
            data, 
            patterns, 
            targets, 
            period,
            healthScore,
            totalMeals,
            avgCalories
        );

        return {
            patterns,
            healthScore, // Use locally calculated score
            summary: aiResult.summary,
            recommendations: aiResult.recommendations,
        };
    }

    // ============ AI INSIGHTS ============

    private async generateAiSummary(
        data: AggregatedDayData[],
        patterns: HabitPatternDto[],
        targets: UserTargets,
        period: PeriodType,
        healthScore: number,
        totalMeals: number,
        avgCalories: number
    ): Promise<{ summary: string; recommendations: string[] }> {
        // Generate insights using Gemini - only needs summary and recommendations
        return await this.geminiClient.generateInsights(
            data,
            patterns,
            {
                period: period.toUpperCase(),
                daysCount: data.length,
                avgCalories,
                targetCalories: targets.calories,
                healthScore,
                totalMeals,
            }
        );
    }

    // ============ RESPONSE BUILDERS ============

    private buildResponse(
        userId: string,
        period: PeriodType,
        dateRange: { start: string; end: string },
        data: AggregatedDayData[],
        analysis: AnalysisResult,
        budgetInsight?: BudgetInsightDto
    ): HabitInsightResponseDto {
        const totalMeals = data.reduce((sum, d) => sum + (d.mealCount || 0), 0);
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
            summary: analysis.summary,
            recommendations: analysis.recommendations,
            healthScore: analysis.healthScore,
            generatedAt: new Date().toISOString(),
            budgetInsight,
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
        // Format date range untuk display
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        const dateFormatter = new Intl.DateTimeFormat('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
        const startFormatted = dateFormatter.format(startDate);
        const endFormatted = dateFormatter.format(endDate);

        // Period labels
        const periodLabels: Record<PeriodType, string> = {
            [PeriodType.WEEKLY]: 'minggu ini',
            [PeriodType.MONTHLY]: 'bulan ini',
            [PeriodType.YEARLY]: 'tahun ini',
            [PeriodType.OVERALL]: 'periode keseluruhan',
        };

        // Dynamic summary and recommendations
        const periodLabel = periodLabels[period] || 'periode ini';
        const summary = `Belum ada data makanan untuk ${periodLabel} (${startFormatted} - ${endFormatted}). Mulai catat makanan Anda untuk mendapatkan insight kesehatan yang personal.`;
        
        const recommendations = [
            'Catat setiap makanan dan minuman yang Anda konsumsi.',
            'Pastikan mencatat porsi dengan akurat untuk analisis yang lebih baik.',
            'Lakukan pencatatan rutin minimal 3 hari untuk mendapat insight pertama.',
        ];

        return {
            userId,
            period,
            dateRange: { start: dateRange.start, end: dateRange.end },
            daysAnalyzed: 0,
            totalMeals: 0,
            averageCalories: 0,
            patterns: [],
            summary,
            recommendations,
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

        // Get user targets once (optimization - targets don't change per month)
        const targets = await this.getUserTargets(userId);

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
                
                // Safety check for aggregated data
                if (aggregatedData.length === 0) {
                    this.logger.warn(`Empty aggregation for month ${monthStr}`);
                    continue;
                }
                
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

    // ============ BUDGET INSIGHT METHODS ============

    /**
     * Generate budget insight for a user
     */
    private async generateBudgetInsight(
        userId: string,
        dateRange: { start: string; end: string },
        aggregatedData: AggregatedDayData[]
    ): Promise<BudgetInsightDto | undefined> {
        // Get user preferences to check daily budget
        const supabase = this.supabaseService.getClient();
        const { data: preferences } = await supabase
            .from('user_preferences')
            .select('daily_budget')
            .eq('user_id', userId)
            .single();

        const dailyBudget = preferences?.daily_budget;
        
        // If no budget set, skip budget insight
        if (!dailyBudget || dailyBudget <= 0) {
            return undefined;
        }

        // Get food log items with prices for the period
        const dailySpending = await this.calculateDailySpending(userId, dateRange);

        if (dailySpending.length === 0) {
            return undefined;
        }

        // Calculate metrics
        const totalSpending = dailySpending.reduce((sum, d) => sum + d.spent, 0);
        const averageDailySpending = Math.round(totalSpending / dailySpending.length);
        const daysWithinBudget = dailySpending.filter(d => d.spent <= dailyBudget).length;
        const daysOverBudget = dailySpending.filter(d => d.spent > dailyBudget).length;
        const budgetUtilization = Math.round((averageDailySpending / dailyBudget) * 100);

        // Determine budget tier
        const budgetTier = this.getBudgetTierName(dailyBudget);

        // Determine spending trend
        const spendingTrend = this.calculateSpendingTrend(dailySpending, dailyBudget);

        // Detect budget patterns
        const budgetPatterns = this.detectBudgetPatterns(dailySpending, dailyBudget);

        // Generate budget recommendations
        const budgetRecommendations = this.generateBudgetRecommendations(
            dailyBudget,
            averageDailySpending,
            budgetTier,
            spendingTrend,
            budgetPatterns
        );

        return {
            dailyBudget,
            budgetTier,
            averageDailySpending,
            totalSpending,
            daysWithinBudget,
            daysOverBudget,
            spendingTrend,
            budgetUtilization,
            budgetPatterns,
            budgetRecommendations,
        };
    }

    /**
     * Calculate daily spending from food logs
     */
    private async calculateDailySpending(
        userId: string,
        dateRange: { start: string; end: string }
    ): Promise<{ date: string; spent: number }[]> {
        const supabase = this.supabaseService.getClient();

        // Get food logs with items
        const { data: foodLogs } = await supabase
            .from('food_logs')
            .select(`
                log_id,
                created_at,
                food_log_items!inner(
                    food_id,
                    gram_weight
                )
            `)
            .eq('user_id', userId)
            .gte('created_at', `${dateRange.start}T00:00:00.000Z`)
            .lte('created_at', `${dateRange.end}T23:59:59.999Z`);

        if (!foodLogs?.length) {
            return [];
        }

        // Get all food IDs
        const allFoodIds = foodLogs.flatMap((log: any) =>
            Array.isArray(log.food_log_items)
                ? log.food_log_items.map((item: any) => item.food_id)
                : []
        );

        // Get prices
        const { data: prices } = await supabase
            .from('food_prices')
            .select('food_id, price_per_100g')
            .in('food_id', allFoodIds);

        const priceMap = new Map(
            (prices || []).map((p: any) => [p.food_id, Number(p.price_per_100g) || 0])
        );

        // Calculate daily spending
        const dailyMap = new Map<string, number>();

        for (const log of foodLogs) {
            const date = (log as any).created_at.split('T')[0];
            const items = Array.isArray((log as any).food_log_items)
                ? (log as any).food_log_items
                : [];

            let logCost = 0;
            for (const item of items) {
                const pricePerGram = (priceMap.get(item.food_id) || 3000) / 100;
                logCost += pricePerGram * (item.gram_weight || 100);
            }

            dailyMap.set(date, (dailyMap.get(date) || 0) + logCost);
        }

        return Array.from(dailyMap.entries())
            .map(([date, spent]) => ({ date, spent: Math.round(spent) }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    /**
     * Get budget tier name based on daily budget
     */
    private getBudgetTierName(dailyBudget: number): string {
        if (dailyBudget <= 25000) return 'very_low';
        if (dailyBudget <= 40000) return 'low';
        if (dailyBudget <= 60000) return 'medium';
        if (dailyBudget <= 100000) return 'high';
        return 'very_high';
    }

    /**
     * Calculate spending trend
     */
    private calculateSpendingTrend(
        dailySpending: { date: string; spent: number }[],
        dailyBudget: number
    ): 'increasing' | 'decreasing' | 'stable' {
        if (dailySpending.length < 3) return 'stable';

        const midPoint = Math.floor(dailySpending.length / 2);
        const firstHalf = dailySpending.slice(0, midPoint);
        const secondHalf = dailySpending.slice(midPoint);

        const firstAvg = firstHalf.reduce((sum, d) => sum + d.spent, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, d) => sum + d.spent, 0) / secondHalf.length;

        const threshold = dailyBudget * 0.1;
        if (secondAvg - firstAvg > threshold) return 'increasing';
        if (firstAvg - secondAvg > threshold) return 'decreasing';
        return 'stable';
    }

    /**
     * Detect budget patterns
     */
    private detectBudgetPatterns(
        dailySpending: { date: string; spent: number }[],
        dailyBudget: number
    ): BudgetPatternDto[] {
        const patterns: BudgetPatternDto[] = [];

        // Check for weekend overspending
        const weekendDays = dailySpending.filter(d => {
            const day = new Date(d.date).getDay();
            return day === 0 || day === 6; // Sunday or Saturday
        });

        const weekdayDays = dailySpending.filter(d => {
            const day = new Date(d.date).getDay();
            return day !== 0 && day !== 6;
        });

        if (weekendDays.length > 0 && weekdayDays.length > 0) {
            const weekendAvg = weekendDays.reduce((s, d) => s + d.spent, 0) / weekendDays.length;
            const weekdayAvg = weekdayDays.reduce((s, d) => s + d.spent, 0) / weekdayDays.length;

            if (weekendAvg > weekdayAvg * 1.3) {
                patterns.push({
                    type: 'negative',
                    message: 'Pengeluaran di akhir pekan lebih tinggi dari hari kerja',
                    daysAffected: weekendDays.map(d => d.date),
                    impact: weekendAvg > dailyBudget * 1.2 ? 'High' : 'Medium',
                });
            }
        }

        // Check for consistent budget adherence
        const daysWithinBudget = dailySpending.filter(d => d.spent <= dailyBudget);
        if (daysWithinBudget.length >= dailySpending.length * 0.8) {
            patterns.push({
                type: 'positive',
                message: 'Konsisten menjaga pengeluaran dalam budget',
                daysAffected: daysWithinBudget.map(d => d.date),
                impact: 'High',
            });
        }

        // Check for frequent overspending
        const daysOverBudget = dailySpending.filter(d => d.spent > dailyBudget);
        if (daysOverBudget.length >= dailySpending.length * 0.4) {
            patterns.push({
                type: 'negative',
                message: `${daysOverBudget.length} dari ${dailySpending.length} hari melebihi budget`,
                daysAffected: daysOverBudget.map(d => d.date),
                impact: 'High',
            });
        }

        // Check for extremely high spending days
        const extremeSpendingDays = dailySpending.filter(d => d.spent > dailyBudget * 1.5);
        if (extremeSpendingDays.length > 0) {
            patterns.push({
                type: 'negative',
                message: 'Beberapa hari dengan pengeluaran sangat tinggi (>150% budget)',
                daysAffected: extremeSpendingDays.map(d => d.date),
                impact: 'High',
            });
        }

        // Check for very low spending (might indicate skipped meals)
        const veryLowSpendingDays = dailySpending.filter(d => d.spent < dailyBudget * 0.3 && d.spent > 0);
        if (veryLowSpendingDays.length >= 2) {
            patterns.push({
                type: 'neutral',
                message: 'Beberapa hari dengan pengeluaran sangat rendah',
                daysAffected: veryLowSpendingDays.map(d => d.date),
                impact: 'Low',
            });
        }

        return patterns;
    }

    /**
     * Generate budget recommendations
     */
    private generateBudgetRecommendations(
        dailyBudget: number,
        averageSpending: number,
        budgetTier: string,
        spendingTrend: 'increasing' | 'decreasing' | 'stable',
        patterns: BudgetPatternDto[]
    ): string[] {
        const recommendations: string[] = [];

        // Based on budget tier
        if (budgetTier === 'very_low' || budgetTier === 'low') {
            recommendations.push('Prioritaskan protein nabati seperti tempe dan tahu yang lebih terjangkau');
            recommendations.push('Pertimbangkan meal prep untuk menghemat biaya dan waktu');
        }

        // Based on spending trend
        if (spendingTrend === 'increasing') {
            recommendations.push('Pengeluaran cenderung naik, pertimbangkan untuk review pilihan makanan');
        } else if (spendingTrend === 'decreasing') {
            recommendations.push('Bagus! Pengeluaran cenderung turun, pertahankan pola ini');
        }

        // Based on patterns
        const hasWeekendOverspending = patterns.some(p => 
            p.message.includes('akhir pekan') && p.type === 'negative'
        );
        if (hasWeekendOverspending) {
            recommendations.push('Siapkan makanan untuk akhir pekan agar tidak overspending');
        }

        // Based on average vs budget
        if (averageSpending > dailyBudget) {
            const overAmount = averageSpending - dailyBudget;
            recommendations.push(`Kurangi pengeluaran harian sekitar ${this.formatCurrency(overAmount)} untuk mencapai target budget`);
        } else if (averageSpending < dailyBudget * 0.7) {
            recommendations.push('Budget masih tersisa cukup banyak, bisa dialokasikan untuk snack sehat atau makanan bergizi');
        }

        // General tips based on tier
        const tierTips: Record<string, string[]> = {
            'very_low': [
                'Beli sayuran lokal musiman yang lebih murah',
                'Hindari makanan kemasan dan olahan',
            ],
            'low': [
                'Kombinasikan makan di rumah dan di luar',
                'Cari promo dan diskon di aplikasi food delivery',
            ],
            'medium': [
                'Variasikan sumber protein untuk nutrisi optimal',
                'Pilih paket hemat jika makan di restoran',
            ],
            'high': [
                'Investasi di makanan berkualitas untuk kesehatan jangka panjang',
                'Pertimbangkan makanan organik untuk pilihan lebih sehat',
            ],
            'very_high': [
                'Fokus pada kualitas dan variasi nutrisi',
                'Coba restoran sehat dengan menu bernutrisi tinggi',
            ],
        };

        if (tierTips[budgetTier] && recommendations.length < 5) {
            recommendations.push(...tierTips[budgetTier].slice(0, 5 - recommendations.length));
        }

        return recommendations.slice(0, 5);
    }

    /**
     * Format currency to IDR
     */
    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }
}

// ============ INTERNAL TYPES ============

interface AnalysisResult {
    patterns: HabitPatternDto[];
    healthScore: number;
    summary: string;
    recommendations: string[];
}
