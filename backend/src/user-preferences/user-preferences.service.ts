import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { CreateUserPreferenceDto, UpdateUserPreferenceDto } from './dto';

@Injectable()
export class UserPreferencesService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async create(createDto: CreateUserPreferenceDto) {
    // Check if user exists
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('id')
      .eq('id', createDto.userId)
      .single();

    if (userError || !user) {
      throw new NotFoundException(`User with ID ${createDto.userId} not found`);
    }

    // Check if preference already exists
    const { data: existing } = await this.supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', createDto.userId)
      .single();

    if (existing) {
      throw new ConflictException(
        'User preferences already exist. Use update instead.',
      );
    }

    const { data, error } = await this.supabase
      .from('user_preferences')
      .insert({
        user_id: createDto.userId,
        diet_type: createDto.dietType,
        disliked_foods: createDto.dislikedFoods || [],
        allergies: createDto.allergies || [],
        goals: createDto.goals,
      })
      .select('*, users(*)')
      .single();

    if (error) throw error;
    return data;
  }

  async findByUserId(userId: string) {
    const { data: preference, error } = await this.supabase
      .from('user_preferences')
      .select('*, users(*)')
      .eq('user_id', userId)
      .single();

    if (error || !preference) {
      throw new NotFoundException(`Preferences for user ${userId} not found`);
    }

    return preference;
  }

  async update(userId: string, updateDto: UpdateUserPreferenceDto) {
    await this.findByUserId(userId);

    const updateData: Record<string, unknown> = {};
    if (updateDto.dietType !== undefined)
      updateData.diet_type = updateDto.dietType;
    if (updateDto.dislikedFoods !== undefined)
      updateData.disliked_foods = updateDto.dislikedFoods;
    if (updateDto.allergies !== undefined)
      updateData.allergies = updateDto.allergies;
    if (updateDto.goals !== undefined) updateData.goals = updateDto.goals;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('user_preferences')
      .update(updateData)
      .eq('user_id', userId)
      .select('*, users(*)')
      .single();

    if (error) throw error;
    return data;
  }

  async upsert(userId: string, dto: UpdateUserPreferenceDto) {
    // Check if user exists
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const { data, error } = await this.supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: userId,
          diet_type: dto.dietType,
          disliked_foods: dto.dislikedFoods || [],
          allergies: dto.allergies || [],
          goals: dto.goals,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select('*, users(*)')
      .single();

    if (error) throw error;
    return data;
  }

  async remove(userId: string) {
    await this.findByUserId(userId);

    const { data, error } = await this.supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
