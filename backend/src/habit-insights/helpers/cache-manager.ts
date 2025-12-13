import { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { CACHE_EXPIRY_DAYS } from '../constants';
import { HabitInsightResponseDto, HabitPatternDto, PeriodType } from '../dto';
import { AggregatedDayData, CachedInsight } from '../types';

/**
 * Cache Manager
 * 
 * Handles caching and retrieval of habit insights.
 */

type Period = 'weekly' | 'monthly' | 'yearly' | 'overall';

export class CacheManager {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Get cached insight if valid
     */
    async getCachedInsight(
        userId: string,
        period: Period,
        dateRange: { start: Date; end: Date },
        currentDataHash: string,
    ): Promise<CachedInsight | null> {
        const { data } = await this.supabase
            .from('habit_insights_cache')
            .select('*')
            .eq('user_id', userId)
            .eq('period', period)
            .eq('date_range_start', dateRange.start.toISOString())
            .eq('date_range_end', dateRange.end.toISOString())
            .single();

        if (!data) return null;

        const isExpired = new Date(data.expires_at) < new Date();
        const isDataChanged = data.data_hash !== currentDataHash;

        if (isExpired || isDataChanged) {
            await this.invalidateCache(userId, period);
            return null;
        }

        return data as CachedInsight;
    }

    /**
     * Save insight to cache
     */
    async saveToCache(
        userId: string,
        period: Period,
        dateRange: { start: Date; end: Date },
        patterns: HabitPatternDto[],
        summary: string,
        recommendations: string[],
        healthScore: number,
        dataHash: string,
    ): Promise<void> {
        const expiryDays = CACHE_EXPIRY_DAYS[period as keyof typeof CACHE_EXPIRY_DAYS];
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);

        await this.supabase.from('habit_insights_cache').upsert(
            {
                user_id: userId,
                period,
                date_range_start: dateRange.start.toISOString(),
                date_range_end: dateRange.end.toISOString(),
                patterns,
                summary,
                recommendations,
                health_score: healthScore,
                data_hash: dataHash,
                expires_at: expiresAt.toISOString(),
            },
            {
                onConflict: 'user_id,period,date_range_start,date_range_end',
            },
        );
    }

    /**
     * Build response from cached data
     */
    buildResponseFromCache(
        cached: CachedInsight,
        dateRange: { start: Date; end: Date },
        totalMeals: number,
        daysAnalyzed: number,
    ): HabitInsightResponseDto {
        return {
            userId: cached.user_id,
            period: cached.period as PeriodType,
            dateRange: {
                start: dateRange.start.toISOString(),
                end: dateRange.end.toISOString(),
            },
            summary: cached.summary,
            patterns: cached.patterns as unknown as HabitPatternDto[],
            recommendations: cached.recommendations,
            healthScore: cached.health_score,
            daysAnalyzed,
            totalMeals,
            averageCalories: cached.average_calories ?? 0,
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Invalidate cache for a user/period combination
     */
    private async invalidateCache(userId: string, period: Period): Promise<void> {
        await this.supabase
            .from('habit_insights_cache')
            .delete()
            .eq('user_id', userId)
            .eq('period', period);
    }

    /**
     * Generate hash from aggregated data
     */
    static generateDataHash(data: AggregatedDayData[]): string {
        const dataString = JSON.stringify(data);
        return createHash('md5').update(dataString).digest('hex');
    }

    /**
     * Calculate date range for given period
     */
    static calculateDateRange(period: Period): { start: Date; end: Date } {
        const end = new Date();
        const start = new Date();

        switch (period) {
            case 'weekly':
                start.setDate(end.getDate() - 7);
                break;
            case 'monthly':
                start.setMonth(end.getMonth() - 1);
                break;
            case 'yearly':
                start.setFullYear(end.getFullYear() - 1);
                break;
            case 'overall':
                start.setFullYear(end.getFullYear() - 5);
                break;
        }

        return { start, end };
    }
}
