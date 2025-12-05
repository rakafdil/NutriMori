import { Module } from '@nestjs/common';
import { FoodLogsController } from './food-logs.controller';
import { FoodLogsService } from './food-logs.service';

@Module({
  controllers: [FoodLogsController],
  providers: [FoodLogsService],
  exports: [FoodLogsService],
})
export class FoodLogsModule {}
