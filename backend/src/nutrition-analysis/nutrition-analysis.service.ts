import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import {
    CreateNutritionAnalysisDto,
    MicronutrientsDto,
    NutritionAnalysisResponseDto,
    NutritionFactsNumericDto
} from './dto';

interface FoodLogItem {
    item_id: string;
    log_id: string;
    detected_name: string;
    food_id: string | number;
    confidence_score: number;
    qty: number;
    unit: string;
    gram_weight: number;
    created_at: string;
}

interface FoodNutrient {
    food_id: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    fiber: number;
    sodium: number;
    cholesterol: number;

    // Micronutrients
    calcium: number;
    phosphorus: number;
    iron: number;
    magnesium: number;
    potassium: number;
    zinc: number;
    copper: number;

    vitamin_c: number;
    vitamin_b1: number;
    vitamin_b2: number;
    vitamin_b3: number;
    vitamin_b6: number;
    vitamin_b9: number;
    vitamin_b12: number;

    vitamin_a: number;
    vitamin_d: number;
    vitamin_e: number;
    vitamin_k: number;

    saturated_fat: number;
    monounsaturated_fat: number;
    polyunsaturated_fat: number;
}

interface UserPreferences {
    id: string;
    user_id: string;
    allergies?: string[];
    goals?: string[];
    tastes?: string[];
    medical_history?: string[];
    meal_times?: any;
    daily_budget?: number;
}

interface NutritionRule {
    id: string;
    rule_name: string;
    description: string;
    min_value: number | null;
    max_value: number | null;
    nutrient: string;
    severity: 'warning' | 'info' | 'critical';
    target_type: 'global' | 'per_serving' | 'user_goal' | 'medical_condition' | 'custom';
    target_value: string | number | null;
    output_type: 'warning' | 'info' | 'tag';
    created_at: string;
}

@Injectable()
export class NutritionAnalysisService {
    private readonly logger = new Logger(NutritionAnalysisService.name);
    private nutritionRulesCache: NutritionRule[] | null = null;

    constructor(private readonly supabaseService: SupabaseService) { }

    async analyzeNutrition(
        userId: string,
        createDto: CreateNutritionAnalysisDto,
    ): Promise<NutritionAnalysisResponseDto> {
        const { foodLogId } = createDto;
        const supabase = this.supabaseService.getClient();

        const { data: logData, error: logError } = await supabase
            .from('food_logs')
            .select('user_id')
            .eq('log_id', foodLogId)
            .single();

        if (logError || !logData) throw new NotFoundException('Food log not found');

        const targetUserId = logData.user_id;

        const foodLogItems = await this.getFoodLogItems(foodLogId);
        if (foodLogItems.length === 0) throw new NotFoundException('No food items found');

        const nutritionData = await this.getNutritionDataForItems(foodLogItems);

        const totalNutrition = this.calculateTotalNutrition(foodLogItems, nutritionData);

        const [preferences, rules] = await Promise.all([
            this.getUserPreferences(userId),
            this.getNutritionRules(),
        ]);

        const { healthTags, warnings, meetsGoals } = this.analyzeHealthMetrics(
            totalNutrition,
            preferences,
            rules,
        );

        const micronutrients: MicronutrientsDto = {};

        const analysisNotes = this.buildNotes(totalNutrition, healthTags, warnings);

        const nutritionInsert = {
            food_log_id: foodLogId,
            user_id: targetUserId,
            total_calories: totalNutrition.calories,
            total_protein: totalNutrition.protein,
            total_carbs: totalNutrition.carbs,
            total_fat: totalNutrition.fat,
            total_sugar: totalNutrition.sugar,
            total_fiber: totalNutrition.fiber,
            total_sodium: totalNutrition.sodium,
            total_cholesterol: totalNutrition.cholesterol,
            micronutrients,
            health_tags: healthTags,
            warnings,
        };

        const { data, error } = await supabase
            .from('nutrition_analysis')
            .insert(nutritionInsert)
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);
        return this.formatResponse(data, totalNutrition, micronutrients);
    }

    async getAnalysisByFoodLogId(
        foodLogId: string,
        userId: string,
    ): Promise<NutritionAnalysisResponseDto> {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('nutrition_analysis')
            .select('*')
            .eq('food_log_id', foodLogId)
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            throw new NotFoundException('Nutrition analysis not found');
        }

        const nutrition: NutritionFactsNumericDto = {
            calories: data.total_calories,
            protein: data.total_protein,
            carbs: data.total_carbs,
            fat: data.total_fat,
            sugar: data.total_sugar,
            fiber: data.total_fiber,
            sodium: data.total_sodium,
            cholesterol: data.total_cholesterol,
        };

        return this.formatResponse(data, nutrition, data.micronutrients || {});
    }

    async getUserAnalysisHistory(
        userId: string,
        limit: number = 10,
    ): Promise<NutritionAnalysisResponseDto[]> {
        if (!userId) {
            throw new BadRequestException('User ID is required for history');
        }
        
        const supabase = this.supabaseService.getClient();
        const safeLimit = Number(limit) || 10;

        const { data, error } = await supabase
            .from('nutrition_analysis')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            this.logger.error(`Failed to retrieve history for user ${userId}: ${error.message}`);
            throw new BadRequestException(`Failed to retrieve analysis history: ${error.message}`);
        }

        return (data || []).map(item => {
            const nutrition: NutritionFactsNumericDto = {
                calories: item.total_calories,
                protein: item.total_protein,
                carbs: item.total_carbs,
                fat: item.total_fat,
                sugar: item.total_sugar,
                fiber: item.total_fiber,
                sodium: item.total_sodium,
                cholesterol: item.total_cholesterol,
            };
            return this.formatResponse(item, nutrition, item.micronutrients || {});
        });
    }

    private async getFoodLogItems(logId: string): Promise<FoodLogItem[]> {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('food_log_items')
            .select('*')
            .eq('log_id', logId);

        this.logger.debug({ fn: 'getFoodLogItems', logId, dataLength: data?.length ?? 0, error });

        if (error) throw new NotFoundException(error.message);
        return data;
    }

    private async getNutritionDataForItems(
        items: FoodLogItem[],
    ): Promise<Map<string, FoodNutrient>> {
        const supabase = this.supabaseService.getClient();
        const map = new Map<string, FoodNutrient>();

        const ids = items.map(i => i.food_id);
        const idsStr = ids.map(id => String(id));

        // UUID-based food (existing behavior)
        const uuidIds = idsStr.filter(id => this.isValidUUID(id));
        if (uuidIds.length > 0) {
            const { data } = await supabase.from('food_nutrients').select('*').in('food_id', uuidIds);
            data?.forEach((n: any) => map.set(String(n.food_id), n));
        }

        // Integer food_id → lookup in food_items (fits your schema)
        const intIds = ids
            .filter(id => !this.isValidUUID(String(id)))
            .map(Number)
            .filter(n => !Number.isNaN(n));

        if (intIds.length > 0) {
            const { data } = await supabase
                .from('food_items')
                .select(`
  id, name, condition, food_group,
  energy, protein, total_fat, carbohydrate, sugar, fiber,
  calcium, phosphorus, iron, magnesium, potassium, sodium, zinc, copper,
  vitamin_c, vitamin_b1, vitamin_b2, vitamin_b3, vitamin_b6, vitamin_b9, vitamin_b12,
  vitamin_a, vitamin_d, vitamin_e, vitamin_k,
  saturated_fat, monounsaturated_fat, polyunsaturated_fat, cholesterol
`)
                .in('id', intIds);

data?.forEach((i: any) => {
    const carbs = Number(i.carbohydrate || 0);

    // FIX SUGAR (estimasi 35% karbo bila sugar = 0/NULL)
    const rawSugar = Number(i.sugar);
    const sugarValue = rawSugar > 0 ? rawSugar : carbs * 0.45;

    map.set(String(i.id), {
        food_id: String(i.id),
        calories: Number(i.energy || 0),
        protein: Number(i.protein || 0),
        carbs: carbs,
        fat: Number(i.total_fat || 0),
        sugar: Number(sugarValue),
        fiber: Number(i.fiber || 0),
        sodium: Number(i.sodium || 0),
        cholesterol: Number(i.cholesterol || 0),

        // BONUS: Micronutrients
        calcium: Number(i.calcium || 0),
        phosphorus: Number(i.phosphorus || 0),
        iron: Number(i.iron || 0),
        magnesium: Number(i.magnesium || 0),
        potassium: Number(i.potassium || 0),
        zinc: Number(i.zinc || 0),
        copper: Number(i.copper || 0),

        vitamin_c: Number(i.vitamin_c || 0),
        vitamin_b1: Number(i.vitamin_b1 || 0),
        vitamin_b2: Number(i.vitamin_b2 || 0),
        vitamin_b3: Number(i.vitamin_b3 || 0),
        vitamin_b6: Number(i.vitamin_b6 || 0),
        vitamin_b9: Number(i.vitamin_b9 || 0),
        vitamin_b12: Number(i.vitamin_b12 || 0),

        vitamin_a: Number(i.vitamin_a || 0),
        vitamin_d: Number(i.vitamin_d || 0),
        vitamin_e: Number(i.vitamin_e || 0),
        vitamin_k: Number(i.vitamin_k || 0),

        saturated_fat: Number(i.saturated_fat || 0),
        monounsaturated_fat: Number(i.monounsaturated_fat || 0),
        polyunsaturated_fat: Number(i.polyunsaturated_fat || 0),
    });
});

        }

        return map;
    }

    private calculateTotalNutrition(
        items: FoodLogItem[],
        map: Map<string, FoodNutrient>,
    ): NutritionFactsNumericDto {
        const total = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            sugar: 0,
            fiber: 0,
            sodium: 0,
            cholesterol: 0,
        };
        for (const item of items) {
            const key = String(item.food_id);
            const n = map.get(key);
            if (!n) continue;

            const mul = item.gram_weight / 100;
            total.calories += n.calories * mul;
            total.protein += n.protein * mul;
            total.carbs += n.carbs * mul;
            total.fat += n.fat * mul;
            total.sugar += n.sugar * mul;
            total.fiber += n.fiber * mul;
            total.sodium += n.sodium * mul;
            total.cholesterol += n.cholesterol * mul;
        }

        // round
        Object.keys(total).forEach(k => (total[k] = Number(total[k].toFixed(2))));
        return total;
    }

    private async getUserPreferences(userId: string) {
        const supabase = this.supabaseService.getClient();
        const { data } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        return data || null;
    }

    private async getNutritionRules(): Promise<NutritionRule[]> {
        if (this.nutritionRulesCache) return this.nutritionRulesCache;

        const supabase = this.supabaseService.getClient();
        const { data } = await supabase.from('nutrition_rules').select('*');

        this.nutritionRulesCache = data || [];
        return this.nutritionRulesCache;
    }

    private analyzeHealthMetrics(
        nutrition: NutritionFactsNumericDto,
        prefs: UserPreferences | null,
        rules: NutritionRule[],
    ): { healthTags: string[]; warnings: string[]; meetsGoals: boolean } {
        const tags: string[] = [];
        const warnings: string[] = [];
        let meetsGoals = true;

        const goals = prefs?.goals?.map(g => g.toLowerCase()) ?? [];
        const history = prefs?.medical_history?.map(m => m.toLowerCase()) ?? [];

        for (const r of rules) {
            const val = this.getNutrientValue(nutrition, r.nutrient);
            if (val === null) continue;

            let triggered = false;

            if (r.target_type === 'global') {
                if (r.max_value !== null && val > r.max_value) triggered = true;
                if (r.min_value !== null && val < r.min_value) triggered = true;
            }

            if (r.target_type === 'per_serving') {
                if (r.max_value !== null && val > r.max_value) triggered = true;
            }

            if (r.target_type === 'user_goal') {
                if (!goals.includes(String(r.target_value).toLowerCase())) continue;
                if (r.max_value !== null && val > r.max_value) triggered = true;
                if (r.min_value !== null && val < r.min_value) triggered = true;
            }

            if (r.target_type === 'medical_condition') {
                if (!history.some(h => h.includes(String(r.target_value).toLowerCase()))) continue;
                if (r.max_value !== null && val > r.max_value) triggered = true;
            }

            if (!triggered) continue;

            const msg = r.description || r.rule_name;

            if (r.output_type === 'tag') tags.push(msg);
            if (r.output_type === 'warning') warnings.push(msg);

            // penalty
            if (['warning', 'critical'].includes(r.severity)) {
                meetsGoals = false;
            }
        }

        return { healthTags: tags, warnings, meetsGoals };
    }

    private getNutrientValue(n: NutritionFactsNumericDto, key: string): number | null {
        const map = {
            calories: n.calories,
            protein: n.protein,
            carbs: n.carbs,
            fat: n.fat,
            sugar: n.sugar,
            fiber: n.fiber,
            sodium: n.sodium,
            cholesterol: n.cholesterol,
            added_sugar: n.sugar,
        };

        return map[key.toLowerCase()] ?? null;
    }

    private buildNotes(n: NutritionFactsNumericDto, tags: string[], warnings: string[]): string {
        let note = `Meal has ${n.calories} kcal, ${n.protein}g protein, ${n.carbs}g carbs. `;
        if (tags.length) note += `Good: ${tags.join(', ')}. `;
        if (warnings.length) note += `Warnings: ${warnings.join(', ')}`;
        return note;
    }

    private formatResponse(data: any, n: NutritionFactsNumericDto, micro: MicronutrientsDto): NutritionAnalysisResponseDto {
        const createdAt = data?.created_at ? new Date(data.created_at) : new Date();
        const updatedAt = data?.updated_at ? new Date(data.updated_at) : undefined;

        const response = {
            analysisId: data.id,
            foodLogId: data.food_log_id,
            nutritionFacts: {
                calories: n.calories,
                protein: `${n.protein}g`,
                carbs: `${n.carbs}g`,
                fat: `${n.fat}g`,
                sugar: `${n.sugar}g`,
                fiber: n.fiber ? `${n.fiber}g` : undefined,
                sodium: n.sodium ? `${n.sodium}mg` : undefined,
                cholesterol: n.cholesterol ? `${n.cholesterol}mg` : undefined,
            },
            micronutrients: micro,
            healthTags: data.health_tags || [],
            warnings: data.warnings || [],
            createdAt,
            updatedAt,
        };

        this.logger.debug({ fn: 'formatResponse', response });

        return response;
    }

    private isValidUUID(str: string) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    }
}