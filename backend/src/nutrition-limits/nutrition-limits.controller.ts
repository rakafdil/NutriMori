import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
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
   * Get current user's nutrition limits
   */
  @Get()
  async getNutritionLimits(@Req() req: any) {
    const limits = await this.nutritionLimitsService.getNutritionLimits(
      this.getAccessToken(req),
    );

    if (!limits) {
      return {
        success: false,
        message: 'Nutrition limits not set. Please update your preferences.',
        data: null,
      };
    }

    return {
      success: true,
      data: limits,
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

    // Get user profile
    const { data: user, error: userError } = await this.nutritionLimitsService[
      'getUserClient'
    ](accessToken)
      .from('users')
      .select('id, age, height_cm, weight_kg, gender')
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: 'User profile not found',
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
      return {
        success: false,
        error: 'User preferences not found. Please set your preferences first.',
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
