import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { CreateFoodLogDto, LogFoodInputDto, UpdateFoodLogDto } from './dto';
import { FoodLogWithRelations, DailySummary, WeeklySummary } from './types';

@Injectable()
export class FoodLogsService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async create(createDto: CreateFoodLogDto): Promise<FoodLogWithRelations> {
    // Verify user exists
    const userResult = await this.supabase
      .from('users')
      .select('id')
      .eq('id', createDto.userId)
      .single();

    if (userResult.error || !userResult.data) {
      throw new NotFoundException(`User with ID ${createDto.userId} not found`);
    }

    const result = await this.supabase
      .from('user_food_logs')
      .insert({
        user_id: createDto.userId,
        text: createDto.text,
        normalized_text: createDto.normalizedText,
        nutrients: createDto.nutrients,
        food_item_id: createDto.foodItemId,
        rule_id: createDto.ruleId,
      })
      .select(
        `
        *,
        users(*),
        food_items(*, food_nutrients(*)),
        nutrition_rules(*)
      `,
      )
      .single();

    if (result.error || !result.data) {
      throw result.error || new Error('Failed to create food log');
    }
    return result.data as FoodLogWithRelations;
  }

  async logFood(input: LogFoodInputDto): Promise<FoodLogWithRelations> {
    // Verify user exists
    const userResult = await this.supabase
      .from('users')
      .select('id')
      .eq('id', input.userId)
      .single();

    if (userResult.error || !userResult.data) {
      throw new NotFoundException(`User with ID ${input.userId} not found`);
    }

    // Here you would integrate with AI service to:
    // 1. Normalize the text
    // 2. Extract nutrients
    // 3. Generate embeddings
    // 4. Match with existing food items
    // 5. Check nutrition rules

    // For now, create a basic log entry
    const result = await this.supabase
      .from('user_food_logs')
      .insert({
        user_id: input.userId,
        text: input.text,
        normalized_text: input.text.toLowerCase().trim(),
      })
      .select(
        `
        *,
        users(*),
        food_items(*, food_nutrients(*)),
        nutrition_rules(*)
      `,
      )
      .single();

    if (result.error || !result.data) {
      throw result.error || new Error('Failed to log food');
    }
    return result.data as FoodLogWithRelations;
  }

  async findAll(options?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<FoodLogWithRelations[]> {
    let query = this.supabase
      .from('user_food_logs')
      .select(
        `
        *,
        users(*),
        food_items(*, food_nutrients(*)),
        nutrition_rules(*)
      `,
      )
      .order('created_at', { ascending: false });

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    const result = await query;

    if (result.error) throw result.error;
    return (result.data || []) as FoodLogWithRelations[];
  }

  async findByUser(
    userId: string,
    limit = 50,
  ): Promise<FoodLogWithRelations[]> {
    const result = await this.supabase
      .from('user_food_logs')
      .select(
        `
        *,
        food_items(*, food_nutrients(*)),
        nutrition_rules(*)
      `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (result.error) throw result.error;
    return (result.data || []) as FoodLogWithRelations[];
  }

  async findOne(id: string): Promise<FoodLogWithRelations> {
    const result = await this.supabase
      .from('user_food_logs')
      .select(
        `
        *,
        users(*),
        food_items(*, food_nutrients(*), food_categories(*)),
        nutrition_rules(*)
      `,
      )
      .eq('id', id)
      .single();

    if (result.error || !result.data) {
      throw new NotFoundException(`Food log with ID ${id} not found`);
    }

    return result.data as FoodLogWithRelations;
  }

  async update(
    id: string,
    updateDto: UpdateFoodLogDto,
  ): Promise<FoodLogWithRelations> {
    await this.findOne(id);

    const updateData: Record<string, unknown> = {};
    if (updateDto.text !== undefined) updateData.text = updateDto.text;
    if (updateDto.normalizedText !== undefined)
      updateData.normalized_text = updateDto.normalizedText;
    if (updateDto.nutrients !== undefined)
      updateData.nutrients = updateDto.nutrients;
    if (updateDto.foodItemId !== undefined)
      updateData.food_item_id = updateDto.foodItemId;
    if (updateDto.ruleId !== undefined) updateData.rule_id = updateDto.ruleId;

    const result = await this.supabase
      .from('user_food_logs')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        users(*),
        food_items(*, food_nutrients(*)),
        nutrition_rules(*)
      `,
      )
      .single();

    if (result.error || !result.data) {
      throw result.error || new Error('Failed to update food log');
    }
    return result.data as FoodLogWithRelations;
  }

  async remove(id: string): Promise<FoodLogWithRelations> {
    await this.findOne(id);

    const result = await this.supabase
      .from('user_food_logs')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (result.error || !result.data) {
      throw result.error || new Error('Failed to delete food log');
    }
    return result.data as FoodLogWithRelations;
  }

  async getDailySummary(userId: string, date: Date): Promise<DailySummary> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.supabase
      .from('user_food_logs')
      .select('*, food_items(*, food_nutrients(*))')
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (result.error) throw result.error;

    const typedLogs = (result.data || []) as FoodLogWithRelations[];

    // Calculate totals from nutrients
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sugar: 0,
      sodium: 0,
      fiber: 0,
      cholesterol: 0,
    };

    for (const log of typedLogs) {
      if (log.nutrients && typeof log.nutrients === 'object') {
        const nutrients = log.nutrients;
        for (const key of Object.keys(totals) as Array<keyof typeof totals>) {
          const value = nutrients[key];
          if (typeof value === 'number') {
            totals[key] += value;
          }
        }
      }
    }

    return {
      date,
      logsCount: typedLogs.length,
      logs: typedLogs,
      totals,
    };
  }

  async getWeeklySummary(
    userId: string,
    endDate: Date = new Date(),
  ): Promise<WeeklySummary> {
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    const result = await this.supabase
      .from('user_food_logs')
      .select('*, food_items(*, food_nutrients(*))')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (result.error) throw result.error;

    const typedLogs = (result.data || []) as FoodLogWithRelations[];

    // Group by day
    const dailyData: Record<string, FoodLogWithRelations[]> = {};
    for (const log of typedLogs) {
      const dateKey = new Date(log.created_at).toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = [];
      }
      dailyData[dateKey].push(log);
    }

    return {
      startDate,
      endDate,
      totalLogs: typedLogs.length,
      dailyData,
    };
  }
}
