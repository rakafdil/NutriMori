import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FoodsService } from './foods.service';

@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  /**
   * GET /foods/autocomplete?q=nasi&limit=10
   * Search food items for autocomplete dropdown
   */
  @Get('autocomplete')
  async autocomplete(
    @Query('q') query: string,
    @Query('limit') limitStr?: string,
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query parameter "q" is required');
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    if (isNaN(limit) || limit < 1) {
      throw new BadRequestException('Limit must be a positive number');
    }

    const results = await this.foodsService.autocomplete({
      query,
      limit,
    });

    return {
      success: true,
      data: results,
      count: results.length,
    };
  }

  /**
   * GET /foods/:id
   * Get full food item details by ID
   */
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const food = await this.foodsService.getById(id);

    return {
      success: true,
      data: food,
    };
  }
}
