import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NutritionLimitsService } from '../nutrition-limits';
import { SupabaseService } from '../supabase';
import { UpdateUserPreferenceDto } from './dto';

@Injectable()
export class UserPreferencesService {
  private readonly logger = new Logger(UserPreferencesService.name);

  constructor(
    private supabaseService: SupabaseService,
    private nutritionLimitsService: NutritionLimitsService,
  ) {}

  private getUserClient(accessToken: string) {
    return this.supabaseService.getUserClient(accessToken);
  }

  async findByUserId(accessToken: string) {
    const { data: preference, error } = await this.getUserClient(accessToken)
      .from('user_preferences')
      .select('*, users(*)')
      .single();
    // console.log(preference);
    if (error || !preference) {
      throw new NotFoundException(`Preferences not found`);
    }

    return preference;
  }

  async update(accessToken: string, updateDto: UpdateUserPreferenceDto) {
    const preference = await this.findByUserId(accessToken);
    console.log(preference);

    const updateData: Record<string, unknown> = {};
    if (updateDto.allergies !== undefined)
      updateData.allergies = updateDto.allergies;
    if (updateDto.goals !== undefined) updateData.goals = updateDto.goals;
    if (updateDto.tastes !== undefined) updateData.tastes = updateDto.tastes;
    if (updateDto.medical_history !== undefined)
      updateData.medical_history = updateDto.medical_history;
    if (updateDto.meal_times !== undefined)
      updateData.meal_times = updateDto.meal_times;
    if (updateDto.daily_budget !== undefined)
      updateData.daily_budget = updateDto.daily_budget;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await this.getUserClient(accessToken)
      .from('user_preferences')
      .update(updateData)
      .eq('user_id', preference.user_id)
      .select('*, users(*)')
      .single();

    if (error) throw error;

    // Recalculate nutrition limits if goals or medical_history changed
    if (
      updateDto.goals !== undefined ||
      updateDto.medical_history !== undefined ||
      updateDto.allergies !== undefined
    ) {
      await this.recalculateNutritionLimits(accessToken, data);
    }

    return data;
  }

  async upsert(accessToken: string, dto: UpdateUserPreferenceDto) {
    const { data, error } = await this.getUserClient(accessToken)
      .from('user_preferences')
      .upsert(
        {
          allergies: dto.allergies || [],
          goals: dto.goals || [],
          tastes: dto.tastes || [],
          medical_history: dto.medical_history || [],
          meal_times: dto.meal_times || {},
          daily_budget: dto.daily_budget,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select('*, users(*)')
      .single();

    if (error) throw error;

    // Calculate and save nutrition limits for the user
    await this.recalculateNutritionLimits(accessToken, data);

    return data;
  }

  /**
   * Recalculate nutrition limits based on user data and preferences
   */
  private async recalculateNutritionLimits(
    accessToken: string,
    preferenceData: any,
  ): Promise<void> {
    try {
      const userData = preferenceData.users;
      
      if (!userData || !userData.age || !userData.height_cm || !userData.weight_kg) {
        this.logger.warn('User data incomplete, skipping nutrition limits calculation');
        return;
      }

      const result = await this.nutritionLimitsService.calculateAndSaveNutritionLimits(
        accessToken,
        preferenceData.user_id,
        {
          age: userData.age,
          height_cm: userData.height_cm,
          weight_kg: userData.weight_kg,
          gender: userData.gender,
        },
        {
          goals: preferenceData.goals,
          allergies: preferenceData.allergies,
          medical_history: preferenceData.medical_history,
        },
      );

      if (result.success) {
        this.logger.log(
          `Nutrition limits calculated for user ${preferenceData.user_id}: ${JSON.stringify(result.data)}`,
        );
      } else {
        this.logger.error(
          `Failed to calculate nutrition limits: ${result.error}`,
        );
      }
    } catch (error) {
      this.logger.error('Error recalculating nutrition limits:', error);
      // Don't throw - nutrition limits calculation failure shouldn't break preference update
    }
  }

  async remove(accessToken: string) {
    await this.findByUserId(accessToken);

    const { data, error } = await this.getUserClient(accessToken)
      .from('user_preferences')
      .delete()
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
