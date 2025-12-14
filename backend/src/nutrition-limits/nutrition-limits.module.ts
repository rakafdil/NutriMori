import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { NutritionLimitsController } from './nutrition-limits.controller';
import { NutritionLimitsService } from './nutrition-limits.service';

@Module({
  controllers: [NutritionLimitsController],
  providers: [NutritionLimitsService, GeminiService],
  exports: [NutritionLimitsService, GeminiService],
})
export class NutritionLimitsModule {}
