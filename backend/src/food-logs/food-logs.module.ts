import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { FoodLogsController } from './food-logs.controller';
import { FoodLogsService } from './food-logs.service';

@Module({
  imports: [AuthModule],
  controllers: [FoodLogsController],
  providers: [FoodLogsService],
  exports: [FoodLogsService],
})
export class FoodLogsModule {}
