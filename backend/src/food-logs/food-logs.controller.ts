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
import { CreateFoodLogDto, LogFoodInputDto, UpdateFoodLogDto } from './dto';
import { FoodLogsService } from './food-logs.service';

@Controller('food-logs')
export class FoodLogsController {
  constructor(private readonly foodLogsService: FoodLogsService) {}

  @Post()
  create(@Body() createDto: CreateFoodLogDto) {
    return this.foodLogsService.create(createDto);
  }

  @Post('log')
  logFood(@Body() input: LogFoodInputDto) {
    return this.foodLogsService.logFood(input);
  }

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.foodLogsService.findAll({
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('user/:userId')
  findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.foodLogsService.findByUser(userId, limit ? parseInt(limit) : 50);
  }

  @Get('user/:userId/daily')
  getDailySummary(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('date') date?: string,
  ) {
    return this.foodLogsService.getDailySummary(
      userId,
      date ? new Date(date) : new Date(),
    );
  }

  @Get('user/:userId/weekly')
  getWeeklySummary(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.foodLogsService.getWeeklySummary(
      userId,
      endDate ? new Date(endDate) : new Date(),
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.foodLogsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateFoodLogDto,
  ) {
    return this.foodLogsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.foodLogsService.remove(id);
  }
}
