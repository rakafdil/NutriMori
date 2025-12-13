import { Logger } from '@nestjs/common';
import { GEMINI_CONFIG } from '../constants';
import { HabitPatternDto } from '../dto';
import { AggregatedDayData, AiInsightResult } from '../types';

/**
 * Gemini AI Client
 * 
 * Handles communication with Gemini API using ultra-compact format
 * for maximum token efficiency (~70% reduction).
 */

// ============ CONTEXT INTERFACE ============

interface InsightContext {
    period: string;
    daysCount: number;
    avgCalories: number;
    targetCalories: number;
    healthTags?: string[];
    warnings?: string[];
}

// ============ COMPACT STATS BUILDER ============

/**
 * Instead of sending all daily data, we send aggregated stats only
 * This reduces tokens by ~60-80% for longer periods
 */
const buildCompactStats = (data: AggregatedDayData[]): string => {
    if (data.length === 0) return 'N/A';
    
    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    
    const cal = avg(data.map(d => d.totalCalories ?? 0));
    const pro = avg(data.map(d => d.totalProtein ?? 0));
    const sug = avg(data.map(d => d.totalSugar ?? 0));
    const fib = avg(data.map(d => d.totalFiber ?? 0));
    const meals = avg(data.map(d => d.mealCount ?? 0));
    
    // Only include non-zero values
    const parts: string[] = [`c${cal}`, `p${pro}`, `s${sug}`, `f${fib}`, `m${meals}`];
    return parts.join(',');
};

// ============ PROMPT TEMPLATE (ULTRA COMPACT) ============

const buildPrompt = (
    context: InsightContext,
    stats: string,
    patterns: string,
): string => {
    // Ultra-compact prompt - minimal tokens
    const tags = context.healthTags?.slice(0, 3).join(',') || '';
    const warns = context.warnings?.slice(0, 2).join(',') || '';
    
    return `Gizi.${context.period}(${context.daysCount}d).
AVG:${stats}.T${context.targetCalories}kal.
${tags ? `+${tags}.` : ''}${warns ? `-${warns}.` : ''}
P:${patterns}
JSON:{"s":"2kalimat ID","r":["3saran"],"h":0-100}`;
};

// ============ FALLBACK RECOMMENDATIONS ============

const FALLBACK_RECOMMENDATIONS: Record<string, string> = {
    sarapan: 'Usahakan sarapan sebelum jam 9 pagi dengan menu berprotein.',
    gula: 'Kurangi minuman manis dan dessert, terutama di akhir pekan.',
    garam: 'Kurangi makanan olahan dan tambahkan bumbu alami.',
    sodium: 'Kurangi makanan olahan dan tambahkan bumbu alami.',
    protein: 'Tambahkan sumber protein seperti telur, ikan, atau tahu.',
    serat: 'Konsumsi lebih banyak sayur dan buah setiap hari.',
    default: 'Pertahankan pola makan seimbang dengan sayur dan buah setiap hari.',
};

// ============ GEMINI CLIENT CLASS ============

export class GeminiClient {
    private readonly logger = new Logger(GeminiClient.name);
    private readonly apiKey: string;
    private readonly endpoint: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.endpoint = GEMINI_CONFIG.endpoint;
    }

    /**
     * Check if client is configured
     */
    isConfigured(): boolean {
        return !!this.apiKey;
    }

    /**
     * Generate AI insights from habit data
     * Uses ultra-compact format to minimize token usage
     */
    async generateInsights(
        data: AggregatedDayData[],
        patterns: HabitPatternDto[],
        context: InsightContext,
    ): Promise<AiInsightResult> {
        if (!this.isConfigured()) {
            this.logger.warn('Gemini API key not configured, using fallback');
            return this.generateFallback(patterns);
        }

        // Build ultra-compact stats (instead of full data)
        const stats = buildCompactStats(data);
        
        // Compact patterns (max 5, most impactful first)
        const topPatterns = this.getTopPatterns(patterns, 5);
        const compactPatterns = this.serializePatterns(topPatterns);

        const prompt = buildPrompt(context, stats, compactPatterns);
        
        // Log token estimate for debugging
        const estimatedTokens = Math.ceil(prompt.length / 4);
        this.logger.debug(`Prompt tokens (est): ${estimatedTokens}`);

        try {
            const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: GEMINI_CONFIG.temperature,
                        maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
                    },
                }),
            });

            if (!response.ok) {
                this.logger.error(`Gemini API error: ${response.status}`);
                return this.generateFallback(patterns);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

            const parsed = this.parseAiResponse(text);
            if (parsed) {
                return parsed;
            }

            return this.generateFallback(patterns);
        } catch (error) {
            this.logger.error(`Gemini API call failed: ${error}`);
            return this.generateFallback(patterns);
        }
    }

    /**
     * Get top N patterns, prioritizing high impact and negative patterns
     */
    private getTopPatterns(patterns: HabitPatternDto[], limit: number): HabitPatternDto[] {
        const impactScore = (p: HabitPatternDto): number => {
            let score = 0;
            if (p.impact === 'High') score += 10;
            else if (p.impact === 'Medium') score += 5;
            if (p.type === 'negative') score += 3; // Prioritize negative for recommendations
            return score;
        };
        
        return [...patterns]
            .sort((a, b) => impactScore(b) - impactScore(a))
            .slice(0, limit);
    }

    /**
     * Ultra-compact pattern serialization
     */
    private serializePatterns(patterns: HabitPatternDto[]): string {
        if (patterns.length === 0) return '-';
        
        // Super compact: just type symbol and shortened message
        return patterns.map(p => {
            const type = p.type === 'positive' ? '+' : p.type === 'negative' ? '-' : '~';
            // Shorten message to max 20 chars
            const msg = p.message.length > 20 ? p.message.slice(0, 20) : p.message;
            return `${type}${msg}`;
        }).join('|');
    }

    /**
     * Parse AI response
     */
    private parseAiResponse(text: string): AiInsightResult | null {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        try {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                summary: parsed.s || parsed.summary || '',
                recommendations: parsed.r || parsed.recommendations || [],
                healthScore: parsed.h || parsed.healthScore || undefined,
            };
        } catch {
            return null;
        }
    }

    /**
     * Generate fallback insights without AI
     */
    generateFallback(patterns: HabitPatternDto[]): AiInsightResult {
        const negativePatterns = patterns.filter(p => p.type === 'negative');
        const positivePatterns = patterns.filter(p => p.type === 'positive');

        // Build summary
        let summary = '';
        if (negativePatterns.length > positivePatterns.length) {
            summary = `Ditemukan ${negativePatterns.length} pola yang perlu diperbaiki. `;
        } else if (positivePatterns.length > 0) {
            summary = `Kebiasaan makan cukup baik dengan ${positivePatterns.length} pola positif. `;
        } else {
            summary = 'Data masih terbatas untuk analisis mendalam.';
        }

        // Build recommendations
        const recommendations: string[] = [];
        const addedKeywords = new Set<string>();

        for (const p of negativePatterns.slice(0, 3)) {
            const msg = p.message.toLowerCase();
            
            for (const [keyword, recommendation] of Object.entries(FALLBACK_RECOMMENDATIONS)) {
                if (keyword !== 'default' && msg.includes(keyword) && !addedKeywords.has(keyword)) {
                    recommendations.push(recommendation);
                    addedKeywords.add(keyword);
                    break;
                }
            }
        }

        // Fill with default if needed
        while (recommendations.length < 3) {
            recommendations.push(FALLBACK_RECOMMENDATIONS.default);
            break; // Only add once
        }

        return { summary, recommendations };
    }
}
