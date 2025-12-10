import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import {
    CreateNutritionAnalysisDto,
    MicronutrientsDto,
    NutritionAnalysisResponseDto,
    NutritionFactsDto,
} from './dto';

interface FoodLogWithItems {
    log_id: string;
    user_id: string;
    meal_type: string;
    created_at: string;
    food_log_items: FoodLogItem[];
}

interface FoodLogItem {
    item_id: string;
    food_id: string;
    detected_name: string;
    qty: number;
    unit: string;
    gram_weight: number;
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
}

interface UserPreferences {
    allergies?: string[];
    goals?: string[];
    medical_history?: string[];
}

interface UserData {
    age?: number;
    weight_kg?: number;
    height_cm?: number;
}

@Injectable()
export class NutritionAnalysisService {
    private readonly logger = new Logger(NutritionAnalysisService.name);

    constructor(private readonly supabaseService: SupabaseService) { }

    async analyzeNutrition(
        userId: string,
        createDto: CreateNutritionAnalysisDto,
    ): Promise<NutritionAnalysisResponseDto> {
        const { foodLogId } = createDto;
        const supabase = this.supabaseService.getClient();

        const foodLog = await this.getFoodLogWithItems(foodLogId, userId);

        const nutritionData = await this.getNutritionDataForItems(
            foodLog.food_log_items,
        );

        const totalNutrition = this.calculateTotalNutrition(
            foodLog.food_log_items,
            nutritionData,
        );

        const [userPreferences, userData] = await Promise.all([
            this.getUserPreferences(userId),
            this.getUserData(userId),
        ]);

        const { healthTags, warnings, meetsGoals } = this.analyzeHealthMetrics(
            totalNutrition,
            userPreferences,
            userData,
        );

        const micronutrients = this.calculateMicronutrients(totalNutrition);

        const analysisNotes = this.generateAnalysisNotes(
            totalNutrition,
            healthTags,
            warnings,
        );

        const { data: analysisData, error } = await supabase
            .from('nutrition_analysis')
            .insert({
                food_log_id: foodLogId,
                user_id: userId,
                total_calories: totalNutrition.calories,
                total_protein: totalNutrition.protein,
                total_carbs: totalNutrition.carbs,
                total_fat: totalNutrition.fat,
                total_sugar: totalNutrition.sugar,
                total_fiber: totalNutrition.fiber || 0,
                total_sodium: totalNutrition.sodium || 0,
                total_cholesterol: totalNutrition.cholesterol || 0,
                micronutrients,
                health_tags: healthTags,
                warnings,
                analysis_notes: analysisNotes,
                meets_goals: meetsGoals,
            })
            .select()
            .single();

        if (error) {
            this.logger.error(`Failed to save analysis: ${error.message}`);
            throw new BadRequestException('Failed to save nutrition analysis');
        }

        return this.formatResponse(analysisData, totalNutrition, micronutrients);
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

        return this.formatResponse(
            data,
            {
                calories: data.total_calories,
                protein: data.total_protein,
                carbs: data.total_carbs,
                fat: data.total_fat,
                sugar: data.total_sugar,
                fiber: data.total_fiber,
                sodium: data.total_sodium,
                cholesterol: data.total_cholesterol,
            },
            data.micronutrients || {},
        );
    }

    async getUserAnalysisHistory(
        userId: string,
        limit: number = 10,
    ): Promise<NutritionAnalysisResponseDto[]> {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('nutrition_analysis')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            this.logger.error(`Failed to get analysis history: ${error.message}`);
            throw new BadRequestException('Failed to retrieve analysis history');
        }

        return data.map((item) =>
            this.formatResponse(
                item,
                {
                    calories: item.total_calories,
                    protein: item.total_protein,
                    carbs: item.total_carbs,
                    fat: item.total_fat,
                    sugar: item.total_sugar,
                    fiber: item.total_fiber,
                    sodium: item.total_sodium,
                    cholesterol: item.total_cholesterol,
                },
                item.micronutrients || {},
            ),
        );
    }

    private async getFoodLogWithItems(
        foodLogId: string,
        userId: string,
    ): Promise<FoodLogWithItems> {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('food_logs')
            .select(
                `
        log_id,
        user_id,
        meal_type,
        created_at,
        food_log_items (
          item_id,
          food_id,
          detected_name,
          qty,
          unit,
          gram_weight
        )
      `,
            )
            .eq('log_id', foodLogId)
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            throw new NotFoundException('Food log not found');
        }

        return data as FoodLogWithItems;
    }

    private async getNutritionDataForItems(
        items: FoodLogItem[],
    ): Promise<Map<string, FoodNutrient>> {
        const supabase = this.supabaseService.getClient();
        const foodIds = items.map((item) => item.food_id).filter(Boolean);

        if (foodIds.length === 0) {
            return new Map();
        }

        const nutritionMap = new Map<string, FoodNutrient>();

        // Try to get from food_nutrients first (for UUID food_ids)
        const uuidFoodIds = foodIds.filter((id) => this.isValidUUID(id));
        if (uuidFoodIds.length > 0) {
            const { data: nutrientsData } = await supabase
                .from('food_nutrients')
                .select('*')
                .in('food_id', uuidFoodIds);

            nutrientsData?.forEach((item) => {
                nutritionMap.set(item.food_id, {
                    food_id: item.food_id,
                    calories: parseFloat(item.calories) || 0,
                    protein: parseFloat(item.protein) || 0,
                    carbs: parseFloat(item.carbs) || 0,
                    fat: parseFloat(item.fat) || 0,
                    sugar: parseFloat(item.sugar) || 0,
                    fiber: parseFloat(item.fiber) || 0,
                    sodium: parseFloat(item.sodium) || 0,
                    cholesterol: parseFloat(item.cholesterol) || 0,
                });
            });
        }

        // For non-UUID food_ids, try food_embeddings (which has nutrition_data as JSONB)
        const stringFoodIds = foodIds.filter((id) => !this.isValidUUID(id));
        if (stringFoodIds.length > 0) {
            try {
                const { data: embeddingsData } = await supabase
                    .from('food_embeddings')
                    .select('food_id, nama, nutrition_data')
                    .in('food_id', stringFoodIds.map(id => parseInt(id)).filter(id => !isNaN(id)));

                embeddingsData?.forEach((item) => {
                    const nutritionData = item.nutrition_data || {};
                    const foodIdStr = item.food_id.toString();
                    
                    nutritionMap.set(foodIdStr, {
                        food_id: foodIdStr,
                        calories: parseFloat(nutritionData.calories || nutritionData.energi) || 0,
                        protein: parseFloat(nutritionData.protein) || 0,
                        carbs: parseFloat(nutritionData.carbs || nutritionData.karbohidrat) || 0,
                        fat: parseFloat(nutritionData.fat || nutritionData.lemak) || 0,
                        sugar: parseFloat(nutritionData.sugar || nutritionData.gula) || 0,
                        fiber: parseFloat(nutritionData.fiber || nutritionData.serat) || 0,
                        sodium: parseFloat(nutritionData.sodium || nutritionData.natrium) || 0,
                        cholesterol: parseFloat(nutritionData.cholesterol || nutritionData.kolesterol) || 0,
                    });
                });
            } catch (error) {
                this.logger.warn(`Failed to get data from food_embeddings: ${error.message}`);
            }
        }

        return nutritionMap;
    }

    private calculateTotalNutrition(
        items: FoodLogItem[],
        nutritionMap: Map<string, FoodNutrient>,
    ): NutritionFactsDto {
        const total: NutritionFactsDto = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            sugar: 0,
            fiber: 0,
            sodium: 0,
            cholesterol: 0,
        };

        items.forEach((item) => {
            const nutrition = nutritionMap.get(item.food_id);
            if (nutrition && item.gram_weight) {
                const multiplier = item.gram_weight / 100;

                total.calories += nutrition.calories * multiplier;
                total.protein += nutrition.protein * multiplier;
                total.carbs += nutrition.carbs * multiplier;
                total.fat += nutrition.fat * multiplier;
                total.sugar += nutrition.sugar * multiplier;
                total.fiber = (total.fiber ?? 0) + nutrition.fiber * multiplier;
                total.sodium = (total.sodium ?? 0) + nutrition.sodium * multiplier;
                total.cholesterol = (total.cholesterol ?? 0) + nutrition.cholesterol * multiplier;
            }
        });

        // Round to 2 decimal places
        Object.keys(total).forEach((key) => {
            total[key] = Math.round(total[key] * 100) / 100;
        });

        return total;
    }

    private async getUserPreferences(
        userId: string,
    ): Promise<UserPreferences | null> {
        const supabase = this.supabaseService.getClient();

        const { data } = await supabase
            .from('user_preferences')
            .select('allergies, goals, medical_history')
            .eq('user_id', userId)
            .single();

        return data || null;
    }

    private async getUserData(userId: string): Promise<UserData | null> {
        const supabase = this.supabaseService.getClient();

        const { data } = await supabase
            .from('users')
            .select('age, weight_kg, height_cm')
            .eq('id', userId)
            .single();

        return data || null;
    }

    private analyzeHealthMetrics(
        nutrition: NutritionFactsDto,
        preferences: UserPreferences | null,
        userData: UserData | null,
    ): { healthTags: string[]; warnings: string[]; meetsGoals: boolean } {
        const healthTags: string[] = [];
        const warnings: string[] = [];
        let meetsGoals = true;

        // Analyze macronutrients
        if (nutrition.protein > 25) {
            healthTags.push('High Protein');
        } else if (nutrition.protein < 10) {
            warnings.push('Low protein content');
            meetsGoals = false;
        }

        if (nutrition.sugar < 10) {
            healthTags.push('Low Sugar');
        } else if (nutrition.sugar > 30) {
            warnings.push('High sugar content');
            meetsGoals = false;
        }

        if (nutrition.fiber && nutrition.fiber > 5) {
            healthTags.push('High Fiber');
        } else if (nutrition.fiber && nutrition.fiber < 2) {
            warnings.push('Low fiber content');
        }

        if (nutrition.sodium && nutrition.sodium > 2000) {
            warnings.push('Exceeds daily sodium limit');
            meetsGoals = false;
        }

        if (nutrition.cholesterol && nutrition.cholesterol > 300) {
            warnings.push('High cholesterol');
            meetsGoals = false;
        }

        // Check user goals
        if (preferences?.goals) {
            if (preferences.goals.includes('weight_loss') && nutrition.calories > 600) {
                warnings.push('High calorie meal for weight loss goal');
                meetsGoals = false;
            }

            if (preferences.goals.includes('muscle_gain') && nutrition.protein > 30) {
                healthTags.push('Muscle Building');
            }

            if (preferences.goals.includes('heart_health') && nutrition.sodium && nutrition.sodium < 1000) {
                healthTags.push('Heart Healthy');
            }
        }

        // Balanced meal check
        const proteinCalories = nutrition.protein * 4;
        const carbCalories = nutrition.carbs * 4;
        const fatCalories = nutrition.fat * 9;
        const totalCalories = proteinCalories + carbCalories + fatCalories;

        if (totalCalories > 0) {
            const proteinPercent = (proteinCalories / totalCalories) * 100;
            const carbPercent = (carbCalories / totalCalories) * 100;
            const fatPercent = (fatCalories / totalCalories) * 100;

            // Balanced meal: 30% protein, 40% carbs, 30% fat (with some tolerance)
            if (
                proteinPercent >= 25 &&
                proteinPercent <= 35 &&
                carbPercent >= 35 &&
                carbPercent <= 50 &&
                fatPercent >= 20 &&
                fatPercent <= 35
            ) {
                healthTags.push('Balanced Meal');
            }
        }

        return { healthTags, warnings, meetsGoals };
    }

    private calculateMicronutrients(
        nutrition: NutritionFactsDto,
    ): MicronutrientsDto {
        const micronutrients: MicronutrientsDto = {};

        if (nutrition.fiber && nutrition.fiber > 5) {
            micronutrients.vitamin_c = '15%';
            micronutrients.iron = '8%';
        }

        if (nutrition.protein > 20) {
            micronutrients.iron = micronutrients.iron ? '12%' : '8%';
            micronutrients.vitamin_b12 = '10%';
        }

        if (nutrition.fat > 10) {
            micronutrients.vitamin_a = '12%';
            micronutrients.vitamin_d = '8%';
        }

        return micronutrients;
    }

    private generateAnalysisNotes(
        nutrition: NutritionFactsDto,
        healthTags: string[],
        warnings: string[],
    ): string {
        const notes: string[] = [];

        notes.push(
            `Total meal contains ${nutrition.calories} calories with ${nutrition.protein}g protein, ${nutrition.carbs}g carbs, and ${nutrition.fat}g fat.`,
        );

        if (healthTags.length > 0) {
            notes.push(`Positive aspects: ${healthTags.join(', ')}.`);
        }

        if (warnings.length > 0) {
            notes.push(`Areas to watch: ${warnings.join(', ')}.`);
        } else {
            notes.push('This meal aligns well with your nutritional goals.');
        }

        return notes.join(' ');
    }

    private isValidUUID(str: string): boolean {
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    }

    private formatResponse(
        dbData: any,
        nutrition: NutritionFactsDto,
        micronutrients: MicronutrientsDto,
    ): NutritionAnalysisResponseDto {
        return {
            analysisId: dbData.id,
            foodLogId: dbData.food_log_id,
            userId: dbData.user_id,
            nutritionFacts: nutrition,
            micronutrients,
            healthTags: dbData.health_tags || [],
            analysisNotes: dbData.analysis_notes,
            meetsGoals: dbData.meets_goals ?? true,
            warnings: dbData.warnings || [],
            createdAt: new Date(dbData.created_at),
            updatedAt: dbData.updated_at ? new Date(dbData.updated_at) : undefined,
        };
    }
}
