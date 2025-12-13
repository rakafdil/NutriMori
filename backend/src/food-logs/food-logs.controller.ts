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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/guards';
import {
  CreateFoodLogDto,
  CreateFoodLogItemDto,
  LogFoodInputDto,
  UpdateFoodLogDto,
} from './dto';
import { FoodLogsService } from './food-logs.service';
import { MealType } from './types';

@Controller('food-logs')
@UseGuards(JwtAuthGuard)
export class FoodLogsController {
  constructor(private readonly foodLogsService: FoodLogsService) {}

  @Post()
  create(@GetUser('id') userId: string, @Body() createDto: CreateFoodLogDto) {
    return this.foodLogsService.create(userId, createDto);
  }

  @Post('log')
  logFood(@GetUser('id') userId: string, @Body() input: LogFoodInputDto) {
    return this.foodLogsService.logFood(userId, input);
  }

  @Get('lists')
  findAll(
    @GetUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('mealType') mealType?: string,
  ) {
    return this.foodLogsService.findAll({
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      mealType: mealType ? (mealType as MealType) : undefined,
    });
  }

  // @Get('me')
  // findMyLogs(@GetUser('id') userId: string, @Query('limit') limit?: string) {
  //   return this.foodLogsService.findByUser(
  //     userId,
  //     limit ? parseInt(limit) : 50,
  //   );
  // }

  @Get('daily')
  getDailySummary(@GetUser('id') userId: string, @Query('date') date?: string) {
    return this.foodLogsService.getDailySummary(
      userId,
      date ? new Date(date) : new Date(),
    );
  }

  @Get('weekly')
  getWeeklySummary(
    @GetUser('id') userId: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.foodLogsService.getWeeklySummary(
      userId,
      endDate ? new Date(endDate) : new Date(),
    );
  }

  @Get('streaks')
  getStreaks(
    @GetUser('id') userId: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.foodLogsService.getStreaks(
      userId,
      endDate ? new Date(endDate) : new Date(),
    );
  }

  @Get(':id')
  findOne(
    @GetUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.foodLogsService.findOne(userId, id);
  }

  @Post('/item')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createFoodLogItem(
    @GetUser('id') userId: string,
    @Body() itemDto: CreateFoodLogItemDto,
  ) {
    return this.foodLogsService.createFoodLogItem(userId, itemDto);
  }

  @Patch(':id')
  update(
    @GetUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateFoodLogDto,
  ) {
    return this.foodLogsService.update(userId, id, updateDto);
  }

  @Delete(':id')
  remove(
    @GetUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.foodLogsService.remove(userId, id);
  }
}
