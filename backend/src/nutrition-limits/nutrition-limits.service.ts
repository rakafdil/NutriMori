import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import {
    CalculateNutritionLimitsInputDto,
    NutritionLimitsDto,
    NutritionLimitsResponseDto,
} from './dto';
import { GeminiService } from './gemini.service';

/**
 * Default nutrition limits for average adult (used when AI unavailable or no user data)
 * Based on general dietary guidelines for healthy adults
 */
export const DEFAULT_NUTRITION_LIMITS: NutritionLimitsDto = {
  max_calories: 2000,    // Standard reference intake
  max_protein: 50,       // 10-35% of calories, ~50g for 2000 cal
  max_carbs: 300,        // 45-65% of calories, ~300g for 2000 cal
  max_fat: 65,           // 20-35% of calories, ~65g for 2000 cal
  max_sugar: 50,         // <10% of calories, ~50g for 2000 cal (WHO recommendation)
  max_fiber: 30,         // 25-38g/day average
  max_sodium: 2300,      // FDA recommendation
  max_cholesterol: 300,  // General guideline
  explanation: 'Default values based on general dietary guidelines for healthy adults (2000 kcal reference)',
};

/**
 * Gender-specific default limits
 */
export const DEFAULT_LIMITS_BY_GENDER = {
  male: {
    max_calories: 2500,
    max_protein: 56,
    max_carbs: 350,
    max_fat: 80,
    max_sugar: 62,
    max_fiber: 38,
    max_sodium: 2300,
    max_cholesterol: 300,
    explanation: 'Default values for adult male based on dietary guidelines',
  } as NutritionLimitsDto,
  female: {
    max_calories: 2000,
    max_protein: 46,
    max_carbs: 275,
    max_fat: 65,
    max_sugar: 50,
    max_fiber: 25,
    max_sodium: 2300,
    max_cholesterol: 300,
    explanation: 'Default values for adult female based on dietary guidelines',
  } as NutritionLimitsDto,
};

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
   * Get default nutrition limits (for frontend fallback)
   * Can be called without authentication
   */
  getDefaultLimits(gender?: string): NutritionLimitsResponseDto {
    if (gender?.toLowerCase() === 'female') {
      return {
        success: true,
        data: { ...DEFAULT_LIMITS_BY_GENDER.female },
        explanation: DEFAULT_LIMITS_BY_GENDER.female.explanation,
      };
    }
    if (gender?.toLowerCase() === 'male') {
      return {
        success: true,
        data: { ...DEFAULT_LIMITS_BY_GENDER.male },
        explanation: DEFAULT_LIMITS_BY_GENDER.male.explanation,
      };
    }
    return {
      success: true,
      data: { ...DEFAULT_NUTRITION_LIMITS },
      explanation: DEFAULT_NUTRITION_LIMITS.explanation,
    };
  }

  /**
   * Build ultra-compact prompt for Gemini (TOON v2)
   * ~80 tokens total (vs ~450 original = 82% reduction)
   */
  private buildNutritionPrompt(input: CalculateNutritionLimitsInputDto): string {
    // Compact encoding: gender 0=f,1=m | activity 0-4 | goals bitmask | medical bitmask
    const g = input.gender?.[0]?.toLowerCase() === 'f' ? 0 : 1;
    const al = { sedentary: 0, light: 1, moderate: 2, active: 3, very_active: 4 }[
      input.activity_level?.toLowerCase() || 'moderate'
    ] ?? 2;
    
    let gf = 0; // goal flags
    if (input.goals?.some(x => /loss|diet/.test(x.toLowerCase()))) gf |= 1;
    if (input.goals?.some(x => /gain|muscle|bulk/.test(x.toLowerCase()))) gf |= 2;
    
    let mf = 0; // medical flags
    if (input.medical_history?.some(x => /diabet/.test(x.toLowerCase()))) mf |= 1;
    if (input.medical_history?.some(x => /hypert|tension/.test(x.toLowerCase()))) mf |= 2;

    // [age,height_cm,weight_kg,gender(0f/1m),activity(0-4),goals(1=loss,2=gain),med(1=diab,2=hyper)]
    const d = [input.age, input.height_cm, input.weight_kg, g, al, gf, mf];

    return `Nutrition limits.D:${JSON.stringify(d)}
[age,h,w,g(0f1m),act(0-4),goal(1loss2gain),med(1diab2hyp)]
Calc:Mifflin-St Jeor*act[1.2,1.375,1.55,1.725,1.9].goal1:-15%,goal2:+10%+protein
Out:[cal,pro,carb,fat,sug,fib,sod,chol]JSON array only`;
  }

  /**
   * Parse ultra-compact array response
   */
  private parseToonResponse(data: any): any {
    // Handle array format [cal,pro,carb,fat,sug,fib,sod,chol]
    if (Array.isArray(data)) {
      return {
        max_calories: Math.round(data[0] || 2000),
        max_protein: Math.round(data[1] || 50),
        max_carbs: Math.round(data[2] || 250),
        max_fat: Math.round(data[3] || 65),
        max_sugar: Math.round(data[4] ?? 50),
        max_fiber: Math.round(data[5] ?? 30),
        max_sodium: Math.round(data[6] ?? 2300),
        max_cholesterol: Math.round(data[7] ?? 300),
        explanation: 'Calculated using Mifflin-St Jeor equation',
      };
    }
    // Fallback to object format
    return {
      max_calories: Math.round(data.cal || data.max_calories || 2000),
      max_protein: Math.round(data.pro || data.max_protein || 50),
      max_carbs: Math.round(data.carb || data.max_carbs || 250),
      max_fat: Math.round(data.fat || data.max_fat || 65),
      max_sugar: Math.round(data.sug || data.max_sugar || 50),
      max_fiber: Math.round(data.fib || data.max_fiber || 30),
      max_sodium: Math.round(data.sod || data.max_sodium || 2300),
      max_cholesterol: Math.round(data.chol || data.max_cholesterol || 300),
      explanation: data.exp || data.explanation || 'Calculated using Mifflin-St Jeor equation',
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
