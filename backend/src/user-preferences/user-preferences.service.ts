import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { UpdateUserPreferenceDto } from './dto';

@Injectable()
export class UserPreferencesService {
  constructor(private supabaseService: SupabaseService) {}

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
    return data;
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
