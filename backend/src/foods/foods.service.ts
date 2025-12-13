import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FoodsRepository,
  FoodItem,
  FoodItemAutocomplete,
} from './foods.repository';

export interface AutocompleteOptions {
  query: string;
  limit?: number;
}

@Injectable()
export class FoodsService {
  constructor(private readonly foodsRepository: FoodsRepository) {}

  /**
   * Search food items for autocomplete
   * Returns lightweight list of matching foods
   */
  async autocomplete(
    options: AutocompleteOptions,
  ): Promise<FoodItemAutocomplete[]> {
    const { query, limit = 10 } = options;

    // Sanitize and validate query
    const sanitizedQuery = query.trim();
    if (sanitizedQuery.length < 1) {
      return [];
    }

    // Clamp limit between 1 and 50
    const clampedLimit = Math.min(Math.max(limit, 1), 50);

    return this.foodsRepository.searchByName(sanitizedQuery, clampedLimit);
  }

  /**
   * Get food item by ID
   * Throws NotFoundException if not found
   */
  async getById(foodId: number): Promise<FoodItem> {
    const food = await this.foodsRepository.findById(foodId);

    if (!food) {
      throw new NotFoundException(`Food item with ID ${foodId} not found`);
    }

    return food;
  }

  /**
   * Get multiple food items by IDs
   * Returns only found items (no error for missing)
   */
  async getByIds(foodIds: number[]): Promise<FoodItem[]> {
    return this.foodsRepository.findByIds(foodIds);
  }
}
