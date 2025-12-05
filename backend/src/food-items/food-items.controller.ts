import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { CreateFoodItemDto, NutrientsDto, UpdateFoodItemDto } from './dto';
import { FoodItemsService } from './food-items.service';

@Controller('food-items')
export class FoodItemsController {
  constructor(private readonly foodItemsService: FoodItemsService) {}

  @Post()
  create(@Body() createDto: CreateFoodItemDto) {
    return this.foodItemsService.create(createDto);
  }

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.foodItemsService.findAll({ category, search });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.foodItemsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateFoodItemDto,
  ) {
    return this.foodItemsService.update(id, updateDto);
  }

  @Patch(':id/nutrients')
  updateNutrients(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() nutrients: NutrientsDto,
  ) {
    return this.foodItemsService.updateNutrients(id, nutrients);
  }

  @Post(':id/categories')
  addCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('category') category: string,
  ) {
    return this.foodItemsService.addCategory(id, category);
  }

  @Delete(':id/categories/:categoryId')
  removeCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.foodItemsService.removeCategory(id, categoryId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.foodItemsService.remove(id);
  }
}
