import { Logger } from '@nestjs/common';
import { GEMINI_CONFIG } from '../constants';
import { HabitPatternDto } from '../dto';
import { AggregatedDayData, AiInsightResult } from '../types';

/**
 * Gemini AI Client
 * 
 * Handles communication with Gemini API using minimal token format.
 * Only requests summary and recommendations - all calculations done locally.
 */

// ============ CONTEXT INTERFACE ============

interface InsightContext {
    period: string;
    daysCount: number;
    avgCalories: number;
    targetCalories: number;
    healthScore: number;
    totalMeals: number;
}

// ============ MINIMAL PROMPT BUILDER ============

/**
 * Build ultra-minimal prompt - only send key metrics
 * Gemini just needs to write summary + recommendations
 * ~20-30 tokens input
 */
const buildMinimalPrompt = (
    context: InsightContext,
    patternSummary: string,
): string => {
    const calStatus = context.avgCalories > context.targetCalories ? 'lebih' : 
                      context.avgCalories < context.targetCalories - 200 ? 'kurang' : 'sesuai';
    
    // Super minimal prompt format
    return `${context.period}:${context.daysCount}hr,${context.totalMeals}mkn,${context.avgCalories}kal(${calStatus}),skor${context.healthScore}.${patternSummary}
Balas JSON:{"s":"ringkasan 1-2 kalimat bahasa Indonesia","r":["3 saran singkat"]}`;
};

// ============ FALLBACK RECOMMENDATIONS ============

const FALLBACK_RECOMMENDATIONS: Record<string, string> = {
    sarapan: 'Usahakan sarapan sebelum jam 9 pagi dengan menu berprotein.',
    gula: 'Kurangi minuman manis dan dessert, ganti dengan buah segar.',
    garam: 'Kurangi makanan olahan dan tambahkan bumbu alami.',
    sodium: 'Kurangi makanan olahan dan tambahkan bumbu alami.',
    protein: 'Tambahkan sumber protein seperti telur, ikan, atau tahu.',
    serat: 'Konsumsi lebih banyak sayur dan buah setiap hari.',
    kalori: 'Perhatikan porsi makan dan hindari makan berlebihan.',
    lemak: 'Batasi gorengan dan pilih metode memasak yang lebih sehat.',
    malam: 'Hindari makan berat setelah jam 8 malam.',
    default: 'Pertahankan pola makan seimbang dengan sayur dan buah setiap hari.',
};

const FALLBACK_SUMMARIES = {
    good: 'Pola makan Anda sudah cukup baik. Pertahankan kebiasaan positif ini.',
    needsWork: 'Ada beberapa kebiasaan makan yang perlu diperbaiki untuk kesehatan yang lebih baik.',
    limited: 'Data masih terbatas, terus catat makanan Anda untuk analisis lebih akurat.',
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
     * Includes retry logic for rate limit errors (429)
     */
    async generateInsights(
        data: AggregatedDayData[],
        patterns: HabitPatternDto[],
        context: InsightContext,
    ): Promise<AiInsightResult> {
        if (!this.isConfigured()) {
            this.logger.warn('Gemini API key not configured, using fallback');
            return this.generateFallback(patterns, data, context);
        }

        // Build minimal pattern summary (just count positive/negative)
        const negCount = patterns.filter(p => p.type === 'negative').length;
        const posCount = patterns.filter(p => p.type === 'positive').length;
        const patternSummary = negCount > 0 || posCount > 0 
            ? `+${posCount}/-${negCount}pola` 
            : '';

        const prompt = buildMinimalPrompt(context, patternSummary);
        
        // Log token estimate for debugging
        const estimatedTokens = Math.ceil(prompt.length / 4);
        this.logger.debug(`Prompt tokens (est): ${estimatedTokens}`);

        // Retry logic for rate limiting
        const maxRetries = 2;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
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

                if (response.status === 429) {
                    // Rate limited - wait and retry
                    if (attempt < maxRetries) {
                        const waitTime = Math.pow(2, attempt + 1) * 1000; // 2s, 4s
                        this.logger.warn(`Rate limited (429), retrying in ${waitTime}ms...`);
                        await this.sleep(waitTime);
                        continue;
                    }
                    this.logger.warn('Rate limit exceeded, using fallback response');
                    return this.generateFallback(patterns, data, context);
                }

                if (!response.ok) {
                    this.logger.error(`Gemini API error: ${response.status}`);
                    return this.generateFallback(patterns, data, context);
                }

                const result = await response.json();
                const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

                const parsed = this.parseAiResponse(text);
                if (parsed) {
                    return parsed;
                }

                return this.generateFallback(patterns, data, context);
            } catch (error) {
                lastError = error as Error;
                if (attempt < maxRetries) {
                    this.logger.warn(`API call failed, retrying... (${attempt + 1}/${maxRetries})`);
                    await this.sleep(1000);
                }
            }
        }

        this.logger.error(`Gemini API call failed after retries: ${lastError}`);
        return this.generateFallback(patterns, data, context);
    }

    /**
     * Sleep utility for retry delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Parse AI response - only extract summary and recommendations
     * healthScore is calculated locally, not from AI
     */
    private parseAiResponse(text: string): AiInsightResult | null {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        try {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                summary: parsed.s || parsed.summary || '',
                recommendations: parsed.r || parsed.recommendations || [],
            };
        } catch {
            return null;
        }
    }

    /**
     * Generate fallback insights without AI
     * Uses pattern analysis and basic statistics
     */
    generateFallback(
        patterns: HabitPatternDto[],
        data?: AggregatedDayData[],
        context?: { period: string; daysCount: number; avgCalories: number; targetCalories: number },
    ): AiInsightResult {
        const negativePatterns = patterns.filter(p => p.type === 'negative');
        const positivePatterns = patterns.filter(p => p.type === 'positive');

        // Build summary based on patterns and data
        let summary = '';
        
        if (data && data.length < 3) {
            summary = FALLBACK_SUMMARIES.limited;
        } else if (negativePatterns.length > positivePatterns.length) {
            summary = FALLBACK_SUMMARIES.needsWork;
            if (context) {
                const calDiff = context.avgCalories - context.targetCalories;
                if (calDiff > 200) {
                    summary += ` Rata-rata kalori ${Math.round(context.avgCalories)} kkal melebihi target.`;
                } else if (calDiff < -300) {
                    summary += ` Asupan kalori ${Math.round(context.avgCalories)} kkal masih di bawah target.`;
                }
            }
        } else if (positivePatterns.length > 0) {
            summary = FALLBACK_SUMMARIES.good;
            if (context && positivePatterns.length >= 3) {
                summary = `Pola makan ${context.period} ini sangat baik dengan ${positivePatterns.length} kebiasaan positif terdeteksi.`;
            }
        } else {
            summary = FALLBACK_SUMMARIES.limited;
        }

        // Build recommendations based on negative patterns
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

        // Add default recommendations if needed
        if (recommendations.length === 0) {
            recommendations.push(FALLBACK_RECOMMENDATIONS.default);
        }

        // healthScore is calculated in service, not here
        return { summary, recommendations };
    }
}
