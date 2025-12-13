import { DAY_ABBREVIATIONS } from '../constants';
import { HabitPatternDto, NutrientTrendDto } from '../dto';
import { AggregatedDayData } from '../types';

/**
 * TOON (Token-Oriented Object Notation) Serializer
 * 
 * Compact serialization format to minimize token usage with LLMs.
 * Reduces API costs by ~60% through abbreviations and compact formats.
 */

// ============ TOON KEY MAPPINGS ============

export const TOON_KEYS = {
    // Day data
    date: 'd',
    dayOfWeek: 'w',
    meals: 'm',
    calories: 'c',
    protein: 'p',
    carbs: 'cb',
    fat: 'f',
    sugar: 's',
    fiber: 'fb',
    sodium: 'na',
    // Pattern
    type: 't',
    message: 'msg',
    impact: 'i',
    daysDetected: 'dd',
    streak: 'st',
    frequency: 'fr',
    // Trends
    nutrient: 'n',
    averageDaily: 'avg',
    trend: 'tr',
    recommended: 'rec',
    status: 'sts',
} as const;

// ============ STATUS ABBREVIATIONS ============

export const STATUS_ABBREVIATIONS: Record<string, string> = {
    'Below target': 'BT',
    'On target': 'OK',
    'Above target': 'AT',
    increasing: '↑',
    decreasing: '↓',
    stable: '→',
    positive: '+',
    negative: '-',
    neutral: '~',
    High: 'H',
    Medium: 'M',
    Low: 'L',
};

// ============ MESSAGE SHORTENERS ============

const MESSAGE_REPLACEMENTS: [RegExp, string][] = [
    [/Melewatkan sarapan/g, 'Skip sarapan'],
    [/Asupan gula berlebih/g, 'Gula↑'],
    [/Konsisten makan sayur/g, 'Sayur✓'],
    [/Asupan protein kurang/g, 'Protein↓'],
    [/Konsumsi garam tinggi/g, 'Garam↑'],
    [/Asupan serat memenuhi/g, 'Serat✓'],
    [/Pola makan konsisten/g, 'Konsisten✓'],
    [/Sering makan larut malam/g, 'Makan malam↑'],
    [/saat makan siang/g, ''],
    [/dari target/g, ''],
    [/terdeteksi/g, ''],
    [/di akhir pekan/g, 'weekend'],
];

// ============ TOON SERIALIZER CLASS ============

export class ToonSerializer {
    /**
     * Serialize aggregated day data to TOON format
     * @example [{d:"10-01",w:"Mo",m:3,c:2100,p:65,s:45,fb:25}]
     */
    static serializeDayData(data: AggregatedDayData[]): Record<string, any>[] {
        return data.map(d => {
            // Support both old and new property names
            const dayOfWeek = d.dayOfWeek || d.dayName || 'Unknown';
            const meals = d.meals ?? d.mealCount ?? 0;
            const calories = d.calories ?? d.totalCalories ?? 0;
            const protein = d.protein ?? d.totalProtein ?? 0;
            const sugar = d.sugar ?? d.totalSugar ?? 0;
            const fiber = d.fiber ?? d.totalFiber ?? 0;
            const sodium = d.sodium ?? d.totalSodium ?? 0;

            const obj: Record<string, any> = {
                [TOON_KEYS.date]: d.date.slice(5), // MM-DD only
                [TOON_KEYS.dayOfWeek]: DAY_ABBREVIATIONS[dayOfWeek] || dayOfWeek.slice(0, 2),
                [TOON_KEYS.meals]: meals,
                [TOON_KEYS.calories]: Math.round(calories),
                [TOON_KEYS.protein]: Math.round(protein),
                [TOON_KEYS.sugar]: Math.round(sugar),
                [TOON_KEYS.fiber]: Math.round(fiber),
            };

            // Only include sodium if significant
            if (sodium > 500) {
                obj[TOON_KEYS.sodium] = Math.round(sodium);
            }

            return obj;
        });
    }

    /**
     * Serialize patterns to TOON format
     * @example [{t:"-",msg:"Skip sarapan 3hr",i:"H",dd:["Mo","Tu"]}]
     */
    static serializePatterns(patterns: HabitPatternDto[]): string {
        if (patterns.length === 0) return '[]';

        const compact = patterns.map(p => {
            const obj: Record<string, any> = {
                [TOON_KEYS.type]: STATUS_ABBREVIATIONS[p.type] || p.type[0],
                [TOON_KEYS.message]: this.shortenMessage(p.message),
            };

            if (p.impact) {
                obj[TOON_KEYS.impact] = STATUS_ABBREVIATIONS[p.impact] || p.impact[0];
            }

            if (p.daysDetected?.length) {
                obj[TOON_KEYS.daysDetected] = p.daysDetected.map(
                    d => DAY_ABBREVIATIONS[d] || d.slice(0, 2)
                );
            }

            if (p.streak) {
                obj[TOON_KEYS.streak] = p.streak;
            }

            return obj;
        });

        return JSON.stringify(compact).replace(/"/g, '');
    }

    /**
     * Serialize nutrient trends to TOON format
     * @example "Pro:65/60↑OK,Gul:48/50→AT"
     */
    static serializeTrends(trends: NutrientTrendDto[]): string {
        if (trends.length === 0) return '-';

        return trends.map(t => {
            const trendSymbol = STATUS_ABBREVIATIONS[t.trend] || '→';
            const statusSymbol = STATUS_ABBREVIATIONS[t.status] || 'OK';
            const nutrientAbbrev = t.nutrient.slice(0, 3);
            return `${nutrientAbbrev}:${Math.round(t.averageDaily)}/${t.recommended}${trendSymbol}${statusSymbol}`;
        }).join(',');
    }

    /**
     * Shorten Indonesian messages for token efficiency
     */
    static shortenMessage(msg: string): string {
        let result = msg;
        for (const [pattern, replacement] of MESSAGE_REPLACEMENTS) {
            result = result.replace(pattern, replacement);
        }
        return result.trim();
    }

    /**
     * Parse TOON response from AI (supports both short and long keys)
     */
    static parseAiResponse(text: string): { summary: string; recommendations: string[]; healthScore?: number } | null {
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
}
