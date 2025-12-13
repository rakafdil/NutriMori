import { Logger } from '@nestjs/common';
import { GEMINI_CONFIG } from '../constants';
import { HabitPatternDto, NutrientTrendDto } from '../dto';
import { AiInsightResult } from '../types';
import { ToonSerializer } from './toon.serializer';

/**
 * Gemini AI Client
 * 
 * Handles communication with Gemini API using TOON format
 * for token-efficient prompts.
 */

// ============ CONTEXT INTERFACE ============

interface InsightContext {
    period: string;
    daysCount: number;
    avgCalories: number;
    targetCalories: number;
    // Health insights from nutrition_analysis
    healthTags?: string[];
    warnings?: string[];
}

// ============ PROMPT TEMPLATE ============

const buildPrompt = (
    context: InsightContext,
    toonData: string,
    toonPatterns: string,
    toonTrends: string,
): string => {
    // Build health tags section if available
    const healthTagsSection = context.healthTags?.length
        ? `\nTAGS: ${context.healthTags.join(', ')}`
        : '';
    
    // Build warnings section if available
    const warningsSection = context.warnings?.length
        ? `\nWARN: ${context.warnings.join('; ')}`
        : '';

    return `Ahli gizi. Analisis TOON (Token-Oriented Object Notation).

LEGEND: d=tgl,w=hari,m=meal,c=kal,p=protein,s=gula,fb=serat,na=sodium,ht=healthTags,wn=warnings
POLA: t=tipe(+baik/-buruk),msg=pesan,i=dampak(H/M/L)
TREN: nutrisi:avg/target↑naik↓turun→stabil (BT=kurang,OK=pas,AT=lebih)

DATA ${context.period} (${context.daysCount}hr, avg ${context.avgCalories}kkal, target ${context.targetCalories}):
${toonData}${healthTagsSection}${warningsSection}

POLA: ${toonPatterns}
TREN: ${toonTrends}

OUTPUT JSON: {"s":"ringkasan 2 kalimat bahasa Indonesia","r":["saran1","saran2","saran3"],"h":skor0-100}`;
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
     */
    async generateInsights(
        toonData: Record<string, any>[],
        toonPatterns: string,
        toonTrends: string,
        context: InsightContext,
        patterns: HabitPatternDto[],
        trends: NutrientTrendDto[],
    ): Promise<AiInsightResult> {
        if (!this.isConfigured()) {
            this.logger.warn('Gemini API key not configured, using fallback');
            return this.generateFallback(patterns, trends);
        }

        const prompt = buildPrompt(
            context,
            JSON.stringify(toonData),
            toonPatterns,
            toonTrends,
        );

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
                return this.generateFallback(patterns, trends);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

            const parsed = ToonSerializer.parseAiResponse(text);
            if (parsed) {
                return parsed;
            }

            return this.generateFallback(patterns, trends);
        } catch (error) {
            this.logger.error(`Gemini API call failed: ${error}`);
            return this.generateFallback(patterns, trends);
        }
    }

    /**
     * Generate fallback insights without AI
     */
    generateFallback(patterns: HabitPatternDto[], trends: NutrientTrendDto[]): AiInsightResult {
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
