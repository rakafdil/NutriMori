import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Query,
    Req,
} from '@nestjs/common';
import {
    CalculateNutritionLimitsInputDto,
    NutritionLimitsResponseDto,
} from './dto';
import { NutritionLimitsService } from './nutrition-limits.service';

@Controller('nutrition-limits')
export class NutritionLimitsController {
  constructor(private readonly nutritionLimitsService: NutritionLimitsService) {}

  private getAccessToken(req: any): string {
    return req.headers.authorization?.replace('Bearer ', '');
  }

  /**
   * Get default nutrition limits (no auth required)
   * Use this as fallback when user has no preferences or Gemini is unavailable
   * @param gender - Optional: 'male' or 'female' for gender-specific defaults
   */
  @Get('defaults')
  getDefaultLimits(@Query('gender') gender?: string) {
    return this.nutritionLimitsService.getDefaultLimits(gender);
  }

  /**
   * Get current user's nutrition limits
   */
  @Get()
  async getNutritionLimits(@Req() req: any) {
    const limits = await this.nutritionLimitsService.getNutritionLimits(
      this.getAccessToken(req),
    );

    if (!limits) {
      // Return default limits instead of error
      return {
        success: true,
        data: this.nutritionLimitsService.getDefaultLimits().data,
        message: 'Using default limits. Update your preferences for personalized limits.',
        isDefault: true,
      };
    }

    return {
      success: true,
      data: limits,
      isDefault: false,
    };
  }

  /**
   * Calculate nutrition limits without saving (preview)
   */
  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  async calculateNutritionLimits(
    @Body() input: CalculateNutritionLimitsInputDto,
  ): Promise<NutritionLimitsResponseDto> {
    return this.nutritionLimitsService.calculateNutritionLimits(input);
  }

  /**
   * Recalculate and save nutrition limits for current user
   * This endpoint can be used to manually trigger recalculation
   */
  @Post('recalculate')
  @HttpCode(HttpStatus.OK)
  async recalculateNutritionLimits(@Req() req: any) {
    const accessToken = this.getAccessToken(req);

    if (!accessToken) {
      return {
        success: false,
        error: 'Access token is required. Please provide a valid Bearer token.',
      };
    }

    // Get user profile - RLS will filter to current user
    const { data: user, error: userError } = await this.nutritionLimitsService[
      'getUserClient'
    ](accessToken)
      .from('users')
      .select('id, age, height_cm, weight_kg, gender')
      .single();

    if (userError) {
      console.error('User query error:', userError);
      return {
        success: false,
        error: `User profile error: ${userError.message}`,
        details: userError.code === 'PGRST116' 
          ? 'No user profile found. Make sure you have completed your profile setup.'
          : userError.message,
      };
    }

    if (!user) {
      return {
        success: false,
        error: 'User profile not found. Please complete your profile first.',
      };
    }

    // Check required fields
    if (!user.age || !user.height_cm || !user.weight_kg) {
      return {
        success: false,
        error: 'Incomplete user profile. Please fill in age, height, and weight.',
        missingFields: {
          age: !user.age,
          height_cm: !user.height_cm,
          weight_kg: !user.weight_kg,
        },
      };
    }

    // Get user preferences
    const { data: preferences, error: prefError } = await this.nutritionLimitsService[
      'getUserClient'
    ](accessToken)
      .from('user_preferences')
      .select('goals, allergies, medical_history')
      .single();

    if (prefError) {
      console.error('Preferences query error:', prefError);
      return {
        success: false,
        error: prefError.code === 'PGRST116'
          ? 'User preferences not found. Please set your preferences first.'
          : `Preferences error: ${prefError.message}`,
      };
    }

    // Calculate and save
    return this.nutritionLimitsService.calculateAndSaveNutritionLimits(
      accessToken,
      user.id,
      {
        age: user.age,
        height_cm: user.height_cm,
        weight_kg: user.weight_kg,
        gender: user.gender,
      },
      {
        goals: preferences.goals,
        allergies: preferences.allergies,
        medical_history: preferences.medical_history,
      },
    );
  }
}
