import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PostgrestError } from '@supabase/supabase-js'; // Import this type
import { SupabaseService } from '../supabase';
import {
  CreateFoodLogDto,
  CreateFoodLogItemDto,
  LogFoodInputDto,
  UpdateFoodLogDto,
} from './dto';
import {
  DailySummary,
  FoodLogWithRelations,
  MealType,
  WeeklySummary,
} from './types';

@Injectable()
export class FoodLogsService {
  constructor(private supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  // Helper to handle Supabase errors consistently
  private handleSupabaseError(
    error: PostgrestError | null,
    fallbackMessage: string,
  ): never {
    if (error) {
      // Wrap the Supabase error message in a standard NestJS exception
      throw new InternalServerErrorException(
        `${fallbackMessage}: ${error.message}`,
      );
    }
    throw new InternalServerErrorException(fallbackMessage);
  }

  async create(
    userId: string,
    createDto: CreateFoodLogDto,
  ): Promise<FoodLogWithRelations> {
    // Verify user exists
    const userResult = await this.supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userResult.error || !userResult.data) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const insertData = {
      user_id: userId,
      raw_text: createDto.rawText,
      meal_type: createDto.mealType,
      parsed_by_llm: createDto.parsedByLlm ?? false,
    };

    const result = await this.supabase
      .from('food_logs')
      .insert(insertData)
      .select('*, food_log_items(*)')
      .single();

    if (result.error) {
      this.handleSupabaseError(result.error, 'Failed to create food log');
    }

    if (!result.data) {
      throw new InternalServerErrorException(
        'Failed to create food log: No data returned',
      );
    }

    return result.data as FoodLogWithRelations;
  }

  async logFood(
    userId: string,
    input: LogFoodInputDto,
  ): Promise<FoodLogWithRelations> {
    // Verify user exists
    const userResult = await this.supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userResult.error || !userResult.data) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const insertData = {
      user_id: userId,
      raw_text: input.text,
      meal_type: input.mealType,
      parsed_by_llm: false,
    };

    const result = await this.supabase
      .from('food_logs')
      .insert(insertData)
      .select('*, food_log_items(*)')
      .single();

    if (result.error) {
      this.handleSupabaseError(result.error, 'Failed to log food');
    }

    if (!result.data) {
      throw new InternalServerErrorException(
        'Failed to log food: No data returned',
      );
    }

    // TODO: Integrate with AI service

    return result.data as FoodLogWithRelations;
  }

  async createFoodLogItem(
    userId: string,
    itemDto: CreateFoodLogItemDto,
  ): Promise<FoodLogWithRelations> {
    // Verify log exists and belongs to user
    await this.findOne(userId, itemDto.logId);

    const insertData = {
      log_id: itemDto.logId,
      detected_name: itemDto.detectedName,
      food_id: itemDto.foodId,
      confidence_score: itemDto.confidenceScore,
      qty: itemDto.qty,
      unit: itemDto.unit,
      gram_weight: itemDto.gramWeight,
    };

    const result = await this.supabase
      .from('food_log_items')
      .insert(insertData)
      .select('*')
      .single();

    if (result.error) {
      this.handleSupabaseError(result.error, 'Failed to create food log item');
    }

    // Return the full log with items
    return this.findOne(userId, itemDto.logId);
  }

  async findAll(options?: {
    userId?: string;
    mealType?: MealType;
    startDate?: Date;
    endDate?: Date;
  }): Promise<FoodLogWithRelations[]> {
    let query = this.supabase
      .from('food_logs')
      .select('*, food_log_items(*)')
      .order('created_at', { ascending: false });

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options?.mealType) {
      query = query.eq('meal_type', options.mealType);
    }

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    const result = await query;

    if (result.error) {
      this.handleSupabaseError(result.error, 'Failed to fetch food logs');
    }

    return (result.data || []) as FoodLogWithRelations[];
  }

  async findByUser(
    userId: string,
    limit = 50,
  ): Promise<FoodLogWithRelations[]> {
    const result = await this.supabase
      .from('food_logs')
      .select('*, food_log_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (result.error) {
      this.handleSupabaseError(result.error, 'Failed to fetch user logs');
    }

    return (result.data || []) as FoodLogWithRelations[];
  }

  async findOne(userId: string, id: string): Promise<FoodLogWithRelations> {
    const result = await this.supabase
      .from('food_logs')
      .select('*, food_log_items(*)')
      .eq('log_id', id)
      .eq('user_id', userId)
      .single();

    if (result.error) {
      // If error code is PGRST116, it implies no rows returned (Not Found)
      if (result.error.code === 'PGRST116') {
        throw new NotFoundException(`Food log with ID ${id} not found`);
      }
      this.handleSupabaseError(result.error, 'Failed to find food log');
    }

    if (!result.data) {
      throw new NotFoundException(`Food log with ID ${id} not found`);
    }

    return result.data as FoodLogWithRelations;
  }

  async update(
    userId: string,
    id: string,
    updateDto: UpdateFoodLogDto,
  ): Promise<FoodLogWithRelations> {
    await this.findOne(userId, id);

    const updateData: Record<string, unknown> = {};
    if (updateDto.rawText !== undefined)
      updateData.raw_text = updateDto.rawText;
    if (updateDto.mealType !== undefined)
      updateData.meal_type = updateDto.mealType;
    if (updateDto.parsedByLlm !== undefined)
      updateData.parsed_by_llm = updateDto.parsedByLlm;

    const result = await this.supabase
      .from('food_logs')
      .update(updateData)
      .eq('log_id', id)
      .select('*, food_log_items(*)')
      .single();

    if (result.error) {
      this.handleSupabaseError(result.error, 'Failed to update food log');
    }

    if (!result.data) {
      throw new InternalServerErrorException(
        'Failed to update food log: No data returned',
      );
    }

    return result.data as FoodLogWithRelations;
  }

  async remove(userId: string, id: string): Promise<FoodLogWithRelations> {
    const log = await this.findOne(userId, id);

    const result = await this.supabase
      .from('food_logs')
      .delete()
      .eq('log_id', id)
      .eq('user_id', userId)
      .select('*, food_log_items(*)')
      .single();

    if (result.error) {
      this.handleSupabaseError(result.error, 'Failed to delete food log');
    }

    return log;
  }

  async removeFoodLogItem(itemId: string): Promise<void> {
    const result = await this.supabase
      .from('food_log_items')
      .delete()
      .eq('item_id', itemId)
      .single();

    // Supabase delete often returns 'PGRST116' if the item didn't exist to begin with
    if (result.error) {
      if (result.error.code === 'PGRST116') {
        throw new NotFoundException(
          `Food log item with ID ${itemId} not found`,
        );
      }
      this.handleSupabaseError(result.error, 'Failed to delete food log item');
    }
  }

  async getDailySummary(userId: string, date: Date): Promise<DailySummary> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.supabase
      .from('food_logs')
      .select('*, food_log_items(*)')
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (result.error) {
      this.handleSupabaseError(result.error, 'Failed to get daily summary');
    }

    const typedLogs = (result.data || []) as FoodLogWithRelations[];

    // TODO: Calculate totals
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
      .from('food_logs')
      .select('*, food_log_items(*)')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (result.error) {
      this.handleSupabaseError(result.error, 'Failed to get weekly summary');
    }

    const typedLogs = (result.data || []) as FoodLogWithRelations[];

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

  async getStreaks(
    userId: string,
    endDate: Date = new Date(),
  ): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastLogDate: Date | null;
  }> {
    // Fetch all logs for the user, ordered by date
    const result = await this.supabase
      .from('food_logs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (result.error) {
      this.handleSupabaseError(result.error, 'Failed to get streaks');
    }

    const logs = result.data || [];

    if (logs.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastLogDate: null };
    }

    // Extract unique dates (normalized to date only, no time)
    const uniqueDates = new Set<string>();
    for (const log of logs) {
      const dateKey = new Date(log.created_at).toISOString().split('T')[0];
      uniqueDates.add(dateKey);
    }

    // Sort dates
    const sortedDates = Array.from(uniqueDates).sort();

    let longestStreak = 1;
    let currentStreakCount = 1;
    let tempStreak = 1;

    // Calculate longest streak
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);

      // Check if dates are consecutive (difference of 1 day)
      const diffTime = currDate.getTime() - prevDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    // Calculate current streak (from endDate backwards)
    const endDateKey = endDate.toISOString().split('T')[0];
    const lastLogDateKey = sortedDates[sortedDates.length - 1];
    const lastLogDate = new Date(lastLogDateKey);

    // Check if the last log is today or yesterday to have an active streak
    const endDateObj = new Date(endDateKey);
    const diffFromEnd =
      (endDateObj.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffFromEnd > 1) {
      // Streak is broken (more than 1 day gap)
      currentStreakCount = 0;
    } else {
      // Count backwards from the last log date
      currentStreakCount = 1;
      for (let i = sortedDates.length - 2; i >= 0; i--) {
        const currDate = new Date(sortedDates[i + 1]);
        const prevDate = new Date(sortedDates[i]);

        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          currentStreakCount++;
        } else {
          break;
        }
      }
    }

    return {
      currentStreak: currentStreakCount,
      longestStreak: Math.max(longestStreak, currentStreakCount),
      lastLogDate,
    };
  }
}
