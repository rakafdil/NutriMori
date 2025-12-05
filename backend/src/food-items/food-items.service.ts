import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase';
import { CreateFoodItemDto, NutrientsDto, UpdateFoodItemDto } from './dto';

@Injectable()
export class FoodItemsService {
    constructor(private supabaseService: SupabaseService) { }

    private get supabase() {
        return this.supabaseService.getClient();
    }

    async create(createDto: CreateFoodItemDto) {
        const { nutrients, categories, ...foodData } = createDto;

        // Create food item
        const { data: foodItem, error: foodError } = await this.supabase
            .from('food_items')
            .insert({
                name: foodData.name,
                description: foodData.description,
                brand: foodData.brand,
                serving_size: foodData.servingSize,
            })
            .select()
            .single();

        if (foodError) throw foodError;

        // Create nutrients if provided
        if (nutrients) {
            await this.supabase.from('food_nutrients').insert({
                food_id: foodItem.id,
                calories: nutrients.calories,
                protein: nutrients.protein,
                carbs: nutrients.carbs,
                fat: nutrients.fat,
                sugar: nutrients.sugar,
                sodium: nutrients.sodium,
                fiber: nutrients.fiber,
                cholesterol: nutrients.cholesterol,
            });
        }

        // Create categories if provided
        if (categories && categories.length > 0) {
            await this.supabase.from('food_categories').insert(
                categories.map((category) => ({
                    food_id: foodItem.id,
                    category,
                })),
            );
        }

        return this.findOne(foodItem.id);
    }

    async findAll(options?: { category?: string; search?: string }) {
        let query = this.supabase
            .from('food_items')
            .select('*, food_nutrients(*), food_categories(*)')
            .order('created_at', { ascending: false });

        if (options?.search) {
            query = query.or(
                `name.ilike.%${options.search}%,description.ilike.%${options.search}%,brand.ilike.%${options.search}%`,
            );
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filter by category if provided
        if (options?.category) {
            return data.filter((item: { food_categories: { category: string }[] }) =>
                item.food_categories?.some((cat: { category: string }) =>
                    cat.category.toLowerCase().includes(options.category!.toLowerCase()),
                ),
            );
        }

        return data;
    }

    async findOne(id: string) {
        const { data: foodItem, error } = await this.supabase
            .from('food_items')
            .select('*, food_nutrients(*), food_categories(*)')
            .eq('id', id)
            .single();

        if (error || !foodItem) {
            throw new NotFoundException(`Food item with ID ${id} not found`);
        }

        return foodItem;
    }

    async update(id: string, updateDto: UpdateFoodItemDto) {
        await this.findOne(id);

        const updateData: Record<string, unknown> = {};
        if (updateDto.name !== undefined) updateData.name = updateDto.name;
        if (updateDto.description !== undefined)
            updateData.description = updateDto.description;
        if (updateDto.brand !== undefined) updateData.brand = updateDto.brand;
        if (updateDto.servingSize !== undefined)
            updateData.serving_size = updateDto.servingSize;

        const { error } = await this.supabase
            .from('food_items')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;

        return this.findOne(id);
    }

    async updateNutrients(id: string, nutrients: NutrientsDto) {
        await this.findOne(id);

        const { data, error } = await this.supabase
            .from('food_nutrients')
            .upsert(
                {
                    food_id: id,
                    calories: nutrients.calories,
                    protein: nutrients.protein,
                    carbs: nutrients.carbs,
                    fat: nutrients.fat,
                    sugar: nutrients.sugar,
                    sodium: nutrients.sodium,
                    fiber: nutrients.fiber,
                    cholesterol: nutrients.cholesterol,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'food_id' },
            )
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async addCategory(id: string, category: string) {
        await this.findOne(id);

        const { data, error } = await this.supabase
            .from('food_categories')
            .insert({
                food_id: id,
                category,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async removeCategory(id: string, categoryId: string) {
        const { data, error } = await this.supabase
            .from('food_categories')
            .delete()
            .eq('id', categoryId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async remove(id: string) {
        await this.findOne(id);

        const { data, error } = await this.supabase
            .from('food_items')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
