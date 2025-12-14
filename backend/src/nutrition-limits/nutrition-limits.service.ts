import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import {
    CalculateNutritionLimitsInputDto,
    NutritionLimitsDto,
    NutritionLimitsResponseDto,
} from './dto';
import { GeminiService } from './gemini.service';

@Injectable()
export class NutritionLimitsService {
  private readonly logger = new Logger(NutritionLimitsService.name);

  constructor(
    private supabaseService: SupabaseService,
    private geminiService: GeminiService,
  ) {}

  private getUserClient(accessToken: string) {
    return this.supabaseService.getUserClient(accessToken);
  }

  private get adminClient() {
    return this.supabaseService.getClient();
  }

  /**
   * Build prompt for Gemini using Token-Oriented Object Notation (TOON)
   * Optimized to reduce token usage while maintaining accuracy
   */
  private buildNutritionPrompt(input: CalculateNutritionLimitsInputDto): string {
    // TOON: Use compact notation with abbreviated keys
    const profile = {
      a: input.age, // age
      h: input.height_cm, // height cm
      w: input.weight_kg, // weight kg
      g: input.gender?.[0] || 'u', // gender: m/f/u
      al: input.activity_level || 'mod', // activity level
      go: input.goals?.length ? input.goals : ['maintain'],
      med: input.medical_history?.length ? input.medical_history : [],
      allg: input.allergies?.length ? input.allergies : [],
    };

    // TOON: Compact prompt with minimal tokens
    return `Nutritionist calc daily limits.
IN:${JSON.stringify(profile)}
Keys:a=age,h=height_cm,w=weight_kg,g=gender(m/f),al=activity(sed/light/mod/act/vact),go=goals,med=medical,allg=allergies
Calc:Mifflin-St Jeor BMR*activity_mult(sed:1.2,light:1.375,mod:1.55,act:1.725,vact:1.9)
Adjust:weight_loss=-15%cal,muscle_gain=+10%cal+high_protein(1.6-2.2g/kg)
OUT JSON only:{"cal":kcal,"pro":g,"carb":g,"fat":g,"sug":g,"fib":g,"sod":mg,"chol":mg,"exp":"brief"}`;
  }

  /**
   * Parse TOON response back to full format
   */
  private parseToonResponse(data: any): any {
    return {
      max_calories: data.cal || data.max_calories,
      max_protein: data.pro || data.max_protein,
      max_carbs: data.carb || data.max_carbs,
      max_fat: data.fat || data.max_fat,
      max_sugar: data.sug || data.max_sugar,
      max_fiber: data.fib || data.max_fiber,
      max_sodium: data.sod || data.max_sodium,
      max_cholesterol: data.chol || data.max_cholesterol,
      explanation: data.exp || data.explanation,
    };
  }

  /**
   * Calculate nutrition limits using Gemini AI
   */
  async calculateNutritionLimits(
    input: CalculateNutritionLimitsInputDto,
  ): Promise<NutritionLimitsResponseDto> {
    try {
      const prompt = this.buildNutritionPrompt(input);
      const response = await this.geminiService.generateStructuredContent(prompt);

      if (!response.success || !response.data) {
        this.logger.error('Failed to get nutrition limits from Gemini:', response.error);
        
        // Fallback to basic calculation if AI fails
        return this.calculateFallbackLimits(input);
      }

      // Parse TOON response (handles both abbreviated and full keys)
      const aiData = this.parseToonResponse(response.data);

      const nutritionLimits: NutritionLimitsDto = {
        max_calories: Math.round(aiData.max_calories || 2000),
        max_protein: Math.round(aiData.max_protein || 50),
        max_carbs: Math.round(aiData.max_carbs || 250),
        max_fat: Math.round(aiData.max_fat || 65),
        max_sugar: Math.round(aiData.max_sugar || 50),
        max_fiber: Math.round(aiData.max_fiber || 25),
        max_sodium: Math.round(aiData.max_sodium || 2300),
        max_cholesterol: Math.round(aiData.max_cholesterol || 300),
      };

      return {
        success: true,
        data: nutritionLimits,
        explanation: aiData.explanation || 'Calculated based on your profile and goals',
      };
    } catch (error) {
      this.logger.error('Error calculating nutrition limits:', error);
      return this.calculateFallbackLimits(input);
    }
  }

  /**
   * Fallback calculation when AI is unavailable
   * Uses Mifflin-St Jeor equation
   */
  private calculateFallbackLimits(
    input: CalculateNutritionLimitsInputDto,
  ): NutritionLimitsResponseDto {
    const { age, height_cm, weight_kg, gender, activity_level, goals } = input;

    // Mifflin-St Jeor BMR calculation
    let bmr: number;
    if (gender?.toLowerCase() === 'female') {
      bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
    } else {
      // Default to male formula
      bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
    }

    // Activity multiplier
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    const multiplier = activityMultipliers[activity_level?.toLowerCase() || 'moderate'] || 1.55;
    let tdee = bmr * multiplier;

    // Goal adjustment
    const hasWeightLossGoal = goals?.some((g) =>
      ['weight_loss', 'diet', 'lose_weight', 'fat_loss'].includes(g.toLowerCase()),
    );
    const hasMuscleGainGoal = goals?.some((g) =>
      ['muscle_gain', 'bulk', 'gain_weight', 'build_muscle'].includes(g.toLowerCase()),
    );

    if (hasWeightLossGoal) {
      tdee *= 0.85; // 15% deficit
    } else if (hasMuscleGainGoal) {
      tdee *= 1.1; // 10% surplus
    }

    const max_calories = Math.round(tdee);

    // Macronutrient distribution
    let proteinRatio = 0.25; // 25% of calories from protein
    let carbRatio = 0.5; // 50% of calories from carbs
    let fatRatio = 0.25; // 25% of calories from fat

    if (hasMuscleGainGoal) {
      proteinRatio = 0.3;
      carbRatio = 0.45;
      fatRatio = 0.25;
    } else if (hasWeightLossGoal) {
      proteinRatio = 0.3;
      carbRatio = 0.4;
      fatRatio = 0.3;
    }

    const max_protein = Math.round((max_calories * proteinRatio) / 4); // 4 cal per gram
    const max_carbs = Math.round((max_calories * carbRatio) / 4); // 4 cal per gram
    const max_fat = Math.round((max_calories * fatRatio) / 9); // 9 cal per gram

    const nutritionLimits: NutritionLimitsDto = {
      max_calories,
      max_protein,
      max_carbs,
      max_fat,
      max_sugar: Math.round(max_calories * 0.05 / 4), // 5% of calories
      max_fiber: gender?.toLowerCase() === 'female' ? 25 : 38,
      max_sodium: 2300,
      max_cholesterol: 300,
    };

    return {
      success: true,
      data: nutritionLimits,
      explanation: 'Calculated using Mifflin-St Jeor equation with standard macronutrient distribution',
    };
  }

  /**
   * Save nutrition limits to nutrition_limits table (upsert)
   */
  async saveNutritionLimits(
    accessToken: string,
    userId: string,
    limits: NutritionLimitsDto,
    explanation?: string,
  ): Promise<void> {
    const { error } = await this.getUserClient(accessToken)
      .from('nutrition_limits')
      .upsert(
        {
          user_id: userId,
          max_calories: limits.max_calories,
          max_protein: limits.max_protein,
          max_carbs: limits.max_carbs,
          max_fat: limits.max_fat,
          max_sugar: limits.max_sugar,
          max_fiber: limits.max_fiber,
          max_sodium: limits.max_sodium,
          max_cholesterol: limits.max_cholesterol,
          explanation: explanation,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (error) {
      this.logger.error('Error saving nutrition limits:', error);
      throw error;
    }

    this.logger.log(`Nutrition limits saved for user ${userId}`);
  }

  /**
   * Get current nutrition limits for a user
   */
  async getNutritionLimits(accessToken: string): Promise<NutritionLimitsDto | null> {
    const { data, error } = await this.getUserClient(accessToken)
      .from('nutrition_limits')
      .select(
        'max_calories, max_protein, max_carbs, max_fat, max_sugar, max_fiber, max_sodium, max_cholesterol, explanation',
      )
      .single();

    if (error || !data) {
      return null;
    }

    // Check if limits have been set
    if (!data.max_calories) {
      return null;
    }

    return {
      max_calories: data.max_calories,
      max_protein: data.max_protein,
      max_carbs: data.max_carbs,
      max_fat: data.max_fat,
      max_sugar: data.max_sugar,
      max_fiber: data.max_fiber,
      max_sodium: data.max_sodium,
      max_cholesterol: data.max_cholesterol,
      explanation: data.explanation,
    };
  }

  /**
   * Calculate and save nutrition limits for a user
   * Called when user creates or updates preferences
   */
  async calculateAndSaveNutritionLimits(
    accessToken: string,
    userId: string,
    userData: {
      age: number;
      height_cm: number;
      weight_kg: number;
      gender?: string;
    },
    preferences: {
      goals?: string[];
      allergies?: string[];
      medical_history?: string[];
      activity_level?: string;
    },
  ): Promise<NutritionLimitsResponseDto> {
    const input: CalculateNutritionLimitsInputDto = {
      age: userData.age,
      height_cm: userData.height_cm,
      weight_kg: userData.weight_kg,
      gender: userData.gender,
      goals: preferences.goals,
      allergies: preferences.allergies,
      medical_history: preferences.medical_history,
      activity_level: preferences.activity_level,
    };

    const result = await this.calculateNutritionLimits(input);

    if (result.success && result.data) {
      await this.saveNutritionLimits(accessToken, userId, result.data, result.explanation);
    }

    return result;
  }
}
