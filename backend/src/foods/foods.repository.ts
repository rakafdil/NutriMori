import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface FoodItem {
  id: number;
  name: string;
  kategori?: string;
  deskripsi?: string;
  satuan?: string;
  berat_per_satuan?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FoodItemAutocomplete {
  id: number;
  name: string;
}

@Injectable()
export class FoodsRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  /**
   * Search food items by name (case-insensitive, partial match)
   * Returns lightweight results for autocomplete
   */
  async searchByName(
    query: string,
    limit: number = 10,
  ): Promise<FoodItemAutocomplete[]> {
    const { data, error } = await this.supabase
      .from('food_items')
      .select('id, name')
      .ilike('name', `%${query}%`)
      .limit(limit)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to search food items: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Fetch single food item by ID
   * Returns full record
   */
  async findById(foodId: number): Promise<FoodItem | null> {
    const { data, error } = await this.supabase
      .from('food_items')
      .select('*')
      .eq('id', foodId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to fetch food item: ${error.message}`);
    }

    return data;
  }

  /**
   * Fetch multiple food items by IDs
   * Useful for batch lookups
   */
  async findByIds(foodIds: number[]): Promise<FoodItem[]> {
    if (foodIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from('food_items')
      .select('*')
      .in('id', foodIds);

    if (error) {
      throw new Error(`Failed to fetch food items: ${error.message}`);
    }

    return data || [];
  }
}
